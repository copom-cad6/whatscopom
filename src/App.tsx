import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { SidebarHeader } from './components/SidebarHeader';
import { ChatList } from './components/ChatList';
import { ChatArea } from './components/ChatArea';
import { EmptyChatState } from './components/EmptyChatState';
import { NewChatModal } from './components/NewChatModal';
import { SimulateMessageModal } from './components/SimulateMessageModal';
import { IntegrationsModal } from './components/IntegrationsModal';
import { AppConfig, Chat, Message, WebhookLog } from './types';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);

  // Modals
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

  // Initialize Socket.io
  useEffect(() => {
    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Initial payload from server
    newSocket.on('init', (data: { chats: Chat[]; config: AppConfig; logs: WebhookLog[] }) => {
      if (data.chats) setChats(data.chats);
      if (data.config) setConfig(data.config);
      if (data.logs) setLogs(data.logs);
    });

    // New message event
    newSocket.on('message:new', (msg: Message) => {
      setMessages((prev) => {
        if (msg.chatId === activeChatId) {
          // Prevent duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        }
        return prev;
      });

      // Update chat snippet in list
      setChats((prevChats) => {
        return prevChats.map((c) => {
          if (c.id === msg.chatId) {
            return {
              ...c,
              lastMessage: {
                text: msg.text || (msg.mediaType ? `[${msg.mediaType}]` : ''),
                timestamp: msg.timestamp,
                fromMe: msg.fromMe,
                status: msg.status
              },
              updatedAt: msg.timestamp,
              unreadCount: msg.fromMe || c.id === activeChatId ? 0 : (c.unreadCount || 0) + 1
            };
          }
          return c;
        }).sort((a, b) => b.updatedAt - a.updatedAt);
      });
    });

    // Message status updated
    newSocket.on('message:status', ({ id, status }: { id: string; status: Message['status'] }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
    });

    // Message reaction updated
    newSocket.on('message:updated', (updated: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
    });

    // Chat updated
    newSocket.on('chat:updated', (updatedChat: Chat) => {
      setChats((prev) => {
        const index = prev.findIndex((c) => c.id === updatedChat.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedChat;
          return next.sort((a, b) => b.updatedAt - a.updatedAt);
        }
        return [updatedChat, ...prev];
      });
    });

    // Typing status
    newSocket.on('typing:status', ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, isTyping } : c))
      );
    });

    // Webhook log
    newSocket.on('webhook:new_log', (log: WebhookLog) => {
      setLogs((prev) => [log, ...prev.slice(0, 49)]);
    });

    // Config updated
    newSocket.on('config:updated', (cfg: AppConfig) => {
      setConfig(cfg);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [activeChatId]);

  // Fetch chats on initial mount as fallback
  useEffect(() => {
    fetch('/api/chats')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setChats(data);
          // Set first chat by default on desktop if none selected
          if (window.innerWidth >= 768 && !activeChatId) {
            selectChat(data[0]);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch initial chats:', err));

    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => {});

    fetch('/api/webhook/logs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch(() => {});
  }, []);

  // When active chat changes, load messages & join socket room
  const selectChat = async (chat: Chat) => {
    setActiveChatId(chat.id);

    if (socket) {
      if (activeChatId) socket.emit('leave:chat', activeChatId);
      socket.emit('join:chat', chat.id);
    }

    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(chat.id)}/messages`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }

      // Mark as read
      fetch(`/api/chats/${encodeURIComponent(chat.id)}/read`, { method: 'POST' }).catch(() => {});
      setChats((prev) =>
        prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    }
  };

  const handleSendMessage = async (
    text: string,
    media?: { mediaType: Message['mediaType']; mediaUrl: string; mediaName: string }
  ) => {
    if (!activeChatId) return;

    try {
      await fetch(`/api/chats/${encodeURIComponent(activeChatId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mediaType: media?.mediaType,
          mediaUrl: media?.mediaUrl,
          mediaName: media?.mediaName
        })
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleReactMessage = (messageId: string, reaction: string) => {
    if (socket) {
      socket.emit('message:react', { messageId, reaction });
    }
  };

  const handleSendTyping = (isTyping: boolean) => {
    if (socket && activeChatId) {
      socket.emit('typing', { chatId: activeChatId, isTyping });
    }
  };

  const handleCreateChat = async (phone: string, name: string, initialMessage?: string) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name })
      });
      const newChat: Chat = await res.json();
      setChats((prev) => [newChat, ...prev.filter((c) => c.id !== newChat.id)]);
      selectChat(newChat);

      if (initialMessage) {
        setTimeout(() => {
          handleSendMessage(initialMessage);
        }, 300);
      }
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const handleSimulateIncoming = async (chatId: string, text: string, senderName?: string) => {
    try {
      await fetch('/api/simulate/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, text, senderName })
      });
    } catch (err) {
      console.error('Error simulating incoming message:', err);
    }
  };

  const handleUpdateConfig = async (partial: Partial<AppConfig>) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial)
    });
    const updated = await res.json();
    setConfig(updated);
  };

  const handleTestEvolution = async () => {
    const res = await fetch('/api/evolution/test', { method: 'POST' });
    return await res.json();
  };

  const handleTestN8n = async () => {
    const res = await fetch('/api/webhook/n8n/test', { method: 'POST' });
    return await res.json();
  };

  const handleClearLogs = async () => {
    await fetch('/api/webhook/logs', { method: 'DELETE' });
    setLogs([]);
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  return (
    <div id="zapchat-app-root" className="flex h-screen w-screen bg-[#0b141a] font-sans text-[#e9edef] overflow-hidden">
      {/* Sidebar (List of chats) */}
      <div
        className={`w-full md:w-[380px] lg:w-[440px] flex flex-col h-full bg-[#111b21] flex-shrink-0 z-20 ${
          activeChatId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <SidebarHeader
          config={config}
          socketConnected={socketConnected}
          onNewChat={() => setIsNewChatOpen(true)}
          onSimulate={() => setIsSimulateOpen(true)}
          onOpenIntegrations={() => setIsIntegrationsOpen(true)}
        />
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={selectChat}
        />
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col h-full bg-[#0b141a] z-10 ${
          activeChatId ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeChat ? (
          <ChatArea
            chat={activeChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            onReactMessage={handleReactMessage}
            onSimulateIncoming={(text) =>
              handleSimulateIncoming(activeChat.id, text || 'Olá, estou testando a resposta pelo WhatsApp!')
            }
            onBack={() => setActiveChatId(null)}
            isTyping={Boolean(activeChat.isTyping)}
            onSendTyping={handleSendTyping}
          />
        ) : (
          <EmptyChatState
            onNewChat={() => setIsNewChatOpen(true)}
            onOpenIntegrations={() => setIsIntegrationsOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onCreateChat={handleCreateChat}
      />

      <SimulateMessageModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        chats={chats}
        activeChat={activeChat}
        onSimulate={handleSimulateIncoming}
      />

      <IntegrationsModal
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        config={config}
        logs={logs}
        onUpdateConfig={handleUpdateConfig}
        onTestEvolution={handleTestEvolution}
        onTestN8n={handleTestN8n}
        onClearLogs={handleClearLogs}
      />
    </div>
  );
}

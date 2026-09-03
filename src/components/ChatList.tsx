import React, { useState } from 'react';
import { Search, X, Check, CheckCheck, Clock, Users } from 'lucide-react';
import { Chat } from '../types';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chat: Chat) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, activeChatId, onSelectChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage?.text || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'unread') {
      return (chat.unreadCount || 0) > 0;
    }
    if (activeFilter === 'groups') {
      return Boolean(chat.isGroup);
    }
    return true;
  });

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Ontem';
    }

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderStatusIcon = (status?: string) => {
    switch (status) {
      case 'read':
        return <CheckCheck className="w-4 h-4 text-[#53bdeb] inline-block mr-1 flex-shrink-0" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-[#8696a0] inline-block mr-1 flex-shrink-0" />;
      case 'sent':
        return <Check className="w-4 h-4 text-[#8696a0] inline-block mr-1 flex-shrink-0" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-[#8696a0] inline-block mr-1 flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div id="chat-list-container" className="flex-1 flex flex-col overflow-hidden bg-[#111b21] border-r border-[#222d34]">
      {/* Search Bar matching Elegant Dark specification */}
      <div className="p-2 border-b border-[#222d34] bg-[#111b21]">
        <div className="bg-[#202c33] flex items-center px-3 py-1.5 rounded-lg">
          <Search className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
          <input
            id="chat-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar ou começar uma nova conversa"
            className="bg-transparent border-none text-sm px-3 focus:outline-none focus:ring-0 w-full text-[#d1d7db] placeholder-[#8696a0]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#8696a0] hover:text-[#e9edef] p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2 px-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40'
                : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
              activeFilter === 'unread'
                ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40'
                : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
            }`}
          >
            Não lidas
            {chats.some((c) => (c.unreadCount || 0) > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884]" />
            )}
          </button>
          <button
            onClick={() => setActiveFilter('groups')}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
              activeFilter === 'groups'
                ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40'
                : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
            }`}
          >
            Grupos
          </button>
        </div>
      </div>

      {/* Chat scroll list */}
      <div id="chats-scroll-list" className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-[#8696a0] text-sm">
            Nenhuma conversa encontrada
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = activeChatId === chat.id;
            const hasUnread = (chat.unreadCount || 0) > 0;
            return (
              <div
                key={chat.id}
                id={`chat-item-${chat.id.replace(/[^a-zA-Z0-9]/g, '_')}`}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center px-3 pt-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                }`}
              >
                {/* Avatar with status indicator */}
                <div className="relative flex-shrink-0 mr-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#4f5e67] flex items-center justify-center text-white font-medium">
                    {chat.avatar ? (
                      <img
                        src={chat.avatar}
                        alt={chat.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-sm">{chat.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  {chat.isOnline && (
                    <span
                      title="Online"
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00a884] border-2 border-[#111b21]"
                    />
                  )}
                </div>

                {/* Info & snippet with border-b */}
                <div className="flex-1 min-w-0 border-b border-[#222d34] pb-3">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-medium text-[15px] text-[#e9edef] truncate">
                      {chat.name}
                    </span>
                    <span
                      className={`text-xs flex-shrink-0 ml-2 ${
                        hasUnread || isSelected ? 'text-[#00a884]' : 'text-[#8696a0]'
                      }`}
                    >
                      {formatTime(chat.lastMessage?.timestamp || chat.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-[#8696a0]">
                    <div className="flex items-center truncate pr-2">
                      {chat.isTyping ? (
                        <span className="text-[#00a884] font-medium text-xs">digitando...</span>
                      ) : (
                        <>
                          {chat.lastMessage?.fromMe && renderStatusIcon(chat.lastMessage.status)}
                          <span className="truncate">{chat.lastMessage?.text || 'Sem mensagens'}</span>
                        </>
                      )}
                    </div>

                    {/* Unread counter badge */}
                    {hasUnread && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#00a884] text-[#111b21] font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';
import { sendEvolutionTextMessage, checkEvolutionConnection } from './server/evolution.js';
import { sendWebhookToN8n } from './server/n8n.js';
import { Message } from './src/types.js';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Socket.IO setup
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Socket.io connection logic
  io.on('connection', (socket) => {
    // Send initial data to newly connected client
    socket.emit('init', {
      chats: store.getChats(),
      config: store.getConfig(),
      logs: store.getWebhookLogs(20)
    });

    socket.on('join:chat', (chatId: string) => {
      socket.join(chatId);
    });

    socket.on('leave:chat', (chatId: string) => {
      socket.leave(chatId);
    });

    socket.on('typing', ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      socket.to(chatId).emit('typing:status', { chatId, isTyping });
    });

    socket.on('message:react', ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      const updated = store.addMessageReaction(messageId, reaction);
      if (updated) {
        io.emit('message:updated', updated);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  // Helper to handle message sending pipeline
  async function processOutgoingMessage(chatId: string, text: string, mediaData?: { mediaType?: Message['mediaType']; mediaUrl?: string; mediaName?: string }) {
    const chat = store.getOrCreateChat(chatId);
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const message: Message = {
      id: messageId,
      chatId: chat.id,
      text: text || '',
      sender: 'user',
      fromMe: true,
      timestamp: Date.now(),
      status: 'sent',
      mediaType: mediaData?.mediaType,
      mediaUrl: mediaData?.mediaUrl,
      mediaName: mediaData?.mediaName
    };

    // 1. Save to store
    store.addMessage(message);

    // 2. Broadcast to all Socket.io clients
    io.emit('message:new', message);
    io.emit('chat:updated', store.getChat(chat.id));

    // 3. Send via Evolution API (in background)
    sendEvolutionTextMessage(chat.id, text)
      .then((evoRes) => {
        if (evoRes.success) {
          store.updateMessageStatus(message.id, 'delivered');
          io.emit('message:status', { id: message.id, status: 'delivered' });
        }
      })
      .catch((err) => {
        console.error('Erro ao enviar via Evolution API:', err);
      });

    // 4. Send webhook to n8n
    sendWebhookToN8n('messages.send', {
      message,
      chatId: chat.id,
      phone: chat.phone,
      senderName: 'Atendente'
    }).then((n8nRes) => {
      io.emit('webhook:new_log', store.getWebhookLogs(1)[0]);
    });

    return message;
  }

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ZapChat Evolution & n8n Bridge',
      timestamp: Date.now()
    });
  });

  // Get all chats
  app.get('/api/chats', (req, res) => {
    res.json(store.getChats());
  });

  // Create new chat
  app.post('/api/chats', (req, res) => {
    const { phone, name } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Número de telefone é obrigatório' });
    }
    const chat = store.getOrCreateChat(phone, name);
    io.emit('chat:updated', chat);
    res.json(chat);
  });

  // Get messages for a specific chat
  app.get('/api/chats/:id/messages', (req, res) => {
    const messages = store.getMessages(req.params.id);
    res.json(messages);
  });

  // Send message to chat
  app.post('/api/chats/:id/messages', async (req, res) => {
    try {
      const { text, mediaType, mediaUrl, mediaName } = req.body;
      const chatId = req.params.id;

      if (!text && !mediaUrl) {
        return res.status(400).json({ error: 'Mensagem de texto ou anexo de mídia é obrigatório' });
      }

      const message = await processOutgoingMessage(chatId, text, { mediaType, mediaUrl, mediaName });
      res.json(message);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao processar mensagem' });
    }
  });

  // Mark chat messages as read
  app.post('/api/chats/:id/read', (req, res) => {
    store.markChatAsRead(req.params.id);
    const chat = store.getChat(req.params.id);
    io.emit('chat:updated', chat);
    res.json({ success: true });
  });

  // Get configuration
  app.get('/api/config', (req, res) => {
    res.json(store.getConfig());
  });

  // Update configuration
  app.post('/api/config', (req, res) => {
    const updated = store.updateConfig(req.body);
    io.emit('config:updated', updated);
    res.json(updated);
  });

  // Test Evolution API connection
  app.post('/api/evolution/test', async (req, res) => {
    const result = await checkEvolutionConnection();
    res.json(result);
  });

  // Test n8n webhook
  app.post('/api/webhook/n8n/test', async (req, res) => {
    const testMsg: Message = {
      id: `test-${Date.now()}`,
      chatId: '5511999999999@s.whatsapp.net',
      text: 'Mensagem de teste disparada pelo ZapChat para validar webhook do n8n.',
      sender: 'user',
      fromMe: true,
      timestamp: Date.now(),
      status: 'sent'
    };

    const result = await sendWebhookToN8n('test', {
      message: testMsg,
      phone: '+55 11 99999-9999',
      senderName: 'ZapChat Teste',
      extra: {
        info: 'Teste de conectividade n8n',
        triggerTime: new Date().toISOString()
      }
    });

    io.emit('webhook:new_log', store.getWebhookLogs(1)[0]);
    res.json(result);
  });

  // Get webhook logs
  app.get('/api/webhook/logs', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json(store.getWebhookLogs(limit));
  });

  // Clear webhook logs
  app.delete('/api/webhook/logs', (req, res) => {
    store.clearWebhookLogs();
    res.json({ success: true });
  });

  // --- Webhook: Incoming from Evolution API ---
  // Evolution API sends events (MESSAGES_UPSERT, MESSAGES_UPDATE, CONNECTION_UPDATE) here!
  app.post('/api/webhook/evolution', async (req, res) => {
    const body = req.body;
    const startTime = Date.now();

    // Log raw incoming webhook
    store.addWebhookLog({
      direction: 'incoming',
      source: 'evolution',
      event: body.event || body.type || 'evolution.event',
      statusCode: 200,
      success: true,
      payload: body,
      durationMs: 0
    });

    try {
      const eventType = body.event || body.type;

      // Handle message upsert (new message received or sent)
      if (eventType === 'messages.upsert' || eventType === 'MESSAGES_UPSERT' || body.data?.message) {
        const msgData = body.data || body;
        const key = msgData.key || {};
        const remoteJid = key.remoteJid || msgData.remoteJid;
        const fromMe = Boolean(key.fromMe ?? msgData.fromMe);
        const id = key.id || msgData.id || `evo-${Date.now()}`;
        const pushName = msgData.pushName || msgData.senderName || 'Contato WhatsApp';

        // Extract message content
        const rawMsg = msgData.message || {};
        const textContent =
          rawMsg.conversation ||
          rawMsg.extendedTextMessage?.text ||
          rawMsg.imageMessage?.caption ||
          rawMsg.videoMessage?.caption ||
          (typeof rawMsg === 'string' ? rawMsg : '');

        if (remoteJid && textContent) {
          const chat = store.getOrCreateChat(remoteJid, fromMe ? undefined : pushName);

          const newMsg: Message = {
            id,
            chatId: chat.id,
            text: textContent,
            sender: fromMe ? 'user' : 'contact',
            fromMe,
            timestamp: msgData.messageTimestamp ? Number(msgData.messageTimestamp) * 1000 : Date.now(),
            status: fromMe ? 'delivered' : 'read'
          };

          store.addMessage(newMsg);

          // Broadcast via Socket.io to all users
          io.emit('message:new', newMsg);
          io.emit('chat:updated', store.getChat(chat.id));

          // Forward incoming message to n8n webhook!
          if (!fromMe) {
            sendWebhookToN8n('messages.upsert', {
              message: newMsg,
              chatId: chat.id,
              phone: chat.phone,
              senderName: pushName,
              extra: { rawEvolution: body }
            }).then(() => {
              io.emit('webhook:new_log', store.getWebhookLogs(1)[0]);
            });
          }
        }
      }

      // Handle connection update
      if (eventType === 'connection.update' || eventType === 'CONNECTION_UPDATE') {
        const state = body.data?.state || body.state;
        if (state) {
          store.updateConfig({
            evolution: {
              ...store.getConfig().evolution,
              state,
              isConnected: state === 'open'
            }
          });
          io.emit('config:updated', store.getConfig());
        }
      }

      res.status(200).json({ status: 'SUCCESS', received: true });
    } catch (err: any) {
      console.error('Erro ao processar webhook da Evolution API:', err);
      res.status(500).json({ error: err?.message || 'Erro interno' });
    }
  });

  // --- Webhook: Incoming from n8n ---
  // n8n workflows can post here to send messages or inject responses into WhatsApp!
  app.post('/api/webhook/n8n/send', async (req, res) => {
    const { phone, number, chatId, text, senderName, mediaUrl } = req.body;
    const target = chatId || phone || number;

    if (!target || !text) {
      return res.status(400).json({
        error: 'Campos obrigatórios: "chatId" (ou "phone"/"number") e "text"'
      });
    }

    const chat = store.getOrCreateChat(target, senderName);
    const messageId = `n8n-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Log incoming webhook from n8n
    store.addWebhookLog({
      direction: 'incoming',
      source: 'n8n',
      event: 'n8n.message_send',
      statusCode: 200,
      success: true,
      payload: req.body,
      durationMs: 0
    });

    const message: Message = {
      id: messageId,
      chatId: chat.id,
      text,
      sender: 'user',
      fromMe: true,
      timestamp: Date.now(),
      status: 'sent',
      mediaUrl: mediaUrl || undefined
    };

    store.addMessage(message);
    io.emit('message:new', message);
    io.emit('chat:updated', store.getChat(chat.id));

    // Send via Evolution API
    sendEvolutionTextMessage(chat.id, text).catch(() => {});

    res.json({
      success: true,
      messageId: message.id,
      chatId: chat.id,
      timestamp: message.timestamp
    });
  });

  // --- Simulation helper endpoint ---
  // Simulates an incoming message from a WhatsApp contact (useful for instant testing & demoing)
  app.post('/api/simulate/incoming', async (req, res) => {
    const { chatId, phone, senderName, text } = req.body;
    const target = chatId || phone || '5511998887777@s.whatsapp.net';
    const chat = store.getOrCreateChat(target, senderName || 'Cliente WhatsApp');

    const messageId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const message: Message = {
      id: messageId,
      chatId: chat.id,
      text: text || 'Olá! Esta é uma mensagem de teste simulada recebida no WhatsApp.',
      sender: 'contact',
      fromMe: false,
      timestamp: Date.now(),
      status: 'read'
    };

    store.addMessage(message);
    io.emit('message:new', message);
    io.emit('chat:updated', store.getChat(chat.id));

    // Also trigger n8n webhook
    sendWebhookToN8n('messages.upsert', {
      message,
      chatId: chat.id,
      phone: chat.phone,
      senderName: chat.name,
      extra: { simulated: true }
    }).then(() => {
      io.emit('webhook:new_log', store.getWebhookLogs(1)[0]);
    });

    res.json({ success: true, message });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ZapChat Evolution Server rodando na porta ${PORT}`);
  });
}

startServer();

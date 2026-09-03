import fs from 'fs';
import path from 'path';
import { AppConfig, Chat, Message, WebhookLog } from '../src/types.js';

// Default initial state
const initialChats: Chat[] = [
  {
    id: '5511998887777@s.whatsapp.net',
    name: 'Suporte Evolution API',
    phone: '+55 11 99888-7777',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    unreadCount: 0,
    updatedAt: Date.now() - 1000 * 60 * 5,
    isOnline: true,
    lastMessage: {
      text: 'Instância Evolution conectada com sucesso! Webhooks ativos.',
      timestamp: Date.now() - 1000 * 60 * 5,
      fromMe: false,
      status: 'read'
    },
    tags: ['Oficial', 'API']
  },
  {
    id: '5511987654321@s.whatsapp.net',
    name: 'Fluxo n8n - Automação',
    phone: '+55 11 98765-4321',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    unreadCount: 1,
    updatedAt: Date.now() - 1000 * 60 * 25,
    isOnline: false,
    lastMessage: {
      text: 'O webhook recebeu seu evento e disparou o fluxo no n8n.',
      timestamp: Date.now() - 1000 * 60 * 25,
      fromMe: false,
      status: 'delivered'
    },
    tags: ['n8n', 'Webhook']
  },
  {
    id: '5521991234567@s.whatsapp.net',
    name: 'Lucas Ferreira',
    phone: '+55 21 99123-4567',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    unreadCount: 0,
    updatedAt: Date.now() - 1000 * 60 * 120,
    isOnline: true,
    lastMessage: {
      text: 'Perfeito, vou aguardar a confirmação do pedido!',
      timestamp: Date.now() - 1000 * 60 * 120,
      fromMe: true,
      status: 'read'
    },
    tags: ['Cliente VIP']
  }
];

const initialMessages: Record<string, Message[]> = {
  '5511998887777@s.whatsapp.net': [
    {
      id: 'msg-1',
      chatId: '5511998887777@s.whatsapp.net',
      text: 'Olá! Bem-vindo ao ZapChat integrado à Evolution API e ao n8n.',
      sender: 'contact',
      fromMe: false,
      timestamp: Date.now() - 1000 * 60 * 30,
      status: 'read'
    },
    {
      id: 'msg-2',
      chatId: '5511998887777@s.whatsapp.net',
      text: 'Show! Como funciona o envio para o n8n?',
      sender: 'user',
      fromMe: true,
      timestamp: Date.now() - 1000 * 60 * 20,
      status: 'read'
    },
    {
      id: 'msg-3',
      chatId: '5511998887777@s.whatsapp.net',
      text: 'Todas as mensagens enviadas e recebidas disparam um webhook automático para a URL do seu n8n configurada.',
      sender: 'contact',
      fromMe: false,
      timestamp: Date.now() - 1000 * 60 * 10,
      status: 'read'
    },
    {
      id: 'msg-4',
      chatId: '5511998887777@s.whatsapp.net',
      text: 'Instância Evolution conectada com sucesso! Webhooks ativos.',
      sender: 'contact',
      fromMe: false,
      timestamp: Date.now() - 1000 * 60 * 5,
      status: 'read'
    }
  ],
  '5511987654321@s.whatsapp.net': [
    {
      id: 'msg-5',
      chatId: '5511987654321@s.whatsapp.net',
      text: 'Teste de integração com n8n iniciado.',
      sender: 'user',
      fromMe: true,
      timestamp: Date.now() - 1000 * 60 * 35,
      status: 'read'
    },
    {
      id: 'msg-6',
      chatId: '5511987654321@s.whatsapp.net',
      text: 'O webhook recebeu seu evento e disparou o fluxo no n8n.',
      sender: 'contact',
      fromMe: false,
      timestamp: Date.now() - 1000 * 60 * 25,
      status: 'delivered'
    }
  ],
  '5521991234567@s.whatsapp.net': [
    {
      id: 'msg-7',
      chatId: '5521991234567@s.whatsapp.net',
      text: 'Bom dia! Gostaria de saber sobre o status do serviço.',
      sender: 'contact',
      fromMe: false,
      timestamp: Date.now() - 1000 * 60 * 150,
      status: 'read'
    },
    {
      id: 'msg-8',
      chatId: '5521991234567@s.whatsapp.net',
      text: 'Perfeito, vou aguardar a confirmação do pedido!',
      sender: 'user',
      fromMe: true,
      timestamp: Date.now() - 1000 * 60 * 120,
      status: 'read'
    }
  ]
};

class Store {
  private chats: Map<string, Chat> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private webhookLogs: WebhookLog[] = [];
  private config: AppConfig;

  constructor() {
    // Populate initial chats
    initialChats.forEach((c) => this.chats.set(c.id, c));
    Object.entries(initialMessages).forEach(([chatId, msgs]) => {
      this.messages.set(chatId, msgs);
    });

    // Default configuration from environment variables
    this.config = {
      evolution: {
        apiUrl: process.env.EVOLUTION_API_URL || 'https://evolution.seudominio.com',
        apiKey: process.env.EVOLUTION_API_KEY || '',
        instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'atendimento',
        isConnected: false,
        state: 'close'
      },
      n8n: {
        webhookUrl: process.env.N8N_WEBHOOK_URL || 'https://n8n.seudominio.com/webhook/whatsapp-evolution',
        webhookSecret: process.env.N8N_WEBHOOK_SECRET || '',
        enabled: true,
        forwardIncoming: true,
        forwardOutgoing: true,
        events: ['messages.upsert', 'messages.send', 'connection.update']
      },
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
        isConfigured: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL)
      },
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    };
  }

  public getChats(): Chat[] {
    return Array.from(this.chats.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getChat(id: string): Chat | undefined {
    return this.chats.get(id);
  }

  public saveChat(chat: Chat): void {
    this.chats.set(chat.id, chat);
  }

  public getOrCreateChat(phoneOrJid: string, name?: string): Chat {
    const cleanId = phoneOrJid.includes('@') ? phoneOrJid : `${phoneOrJid.replace(/\D/g, '')}@s.whatsapp.net`;
    const cleanPhone = phoneOrJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    
    let chat = this.chats.get(cleanId);
    if (!chat) {
      chat = {
        id: cleanId,
        name: name || `+${cleanPhone}`,
        phone: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanPhone}`,
        unreadCount: 0,
        updatedAt: Date.now(),
        isOnline: true
      };
      this.chats.set(cleanId, chat);
    }
    return chat;
  }

  public getMessages(chatId: string): Message[] {
    return this.messages.get(chatId) || [];
  }

  public addMessage(message: Message): Message {
    const list = this.messages.get(message.chatId) || [];
    // Prevent duplicates
    const exists = list.some((m) => m.id === message.id);
    if (!exists) {
      list.push(message);
      this.messages.set(message.chatId, list);
    }

    // Update parent chat
    const chat = this.chats.get(message.chatId);
    if (chat) {
      chat.lastMessage = {
        text: message.text || (message.mediaType ? `[${message.mediaType}]` : ''),
        timestamp: message.timestamp,
        fromMe: message.fromMe,
        status: message.status
      };
      chat.updatedAt = message.timestamp;
      if (!message.fromMe) {
        chat.unreadCount = (chat.unreadCount || 0) + 1;
      }
      this.chats.set(chat.id, chat);
    }

    return message;
  }

  public updateMessageStatus(id: string, status: Message['status']): Message | null {
    for (const [chatId, msgs] of this.messages.entries()) {
      const msg = msgs.find((m) => m.id === id);
      if (msg) {
        msg.status = status;
        const chat = this.chats.get(chatId);
        if (chat && chat.lastMessage) {
          chat.lastMessage.status = status;
        }
        return msg;
      }
    }
    return null;
  }

  public addMessageReaction(messageId: string, reaction: string): Message | null {
    for (const [, msgs] of this.messages.entries()) {
      const msg = msgs.find((m) => m.id === messageId);
      if (msg) {
        msg.reaction = reaction;
        return msg;
      }
    }
    return null;
  }

  public markChatAsRead(chatId: string): void {
    const chat = this.chats.get(chatId);
    if (chat) {
      chat.unreadCount = 0;
      this.chats.set(chatId, chat);
    }
    const msgs = this.messages.get(chatId) || [];
    msgs.forEach((m) => {
      if (!m.fromMe && m.status !== 'read') {
        m.status = 'read';
      }
    });
  }

  public getConfig(): AppConfig {
    return {
      ...this.config,
      // Mask private key if present for security
      firebase: {
        ...this.config.firebase,
        privateKey: this.config.firebase.privateKey ? '********' : ''
      }
    };
  }

  public updateConfig(partial: Partial<AppConfig>): AppConfig {
    if (partial.evolution) {
      this.config.evolution = { ...this.config.evolution, ...partial.evolution };
    }
    if (partial.n8n) {
      this.config.n8n = { ...this.config.n8n, ...partial.n8n };
    }
    if (partial.firebase) {
      this.config.firebase = {
        ...this.config.firebase,
        ...partial.firebase,
        isConfigured: !!(partial.firebase.projectId || this.config.firebase.projectId)
      };
    }
    return this.getConfig();
  }

  public addWebhookLog(log: Omit<WebhookLog, 'id' | 'timestamp'>): WebhookLog {
    const newLog: WebhookLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now()
    };
    this.webhookLogs.unshift(newLog);
    if (this.webhookLogs.length > 200) {
      this.webhookLogs.pop();
    }
    return newLog;
  }

  public getWebhookLogs(limit = 50): WebhookLog[] {
    return this.webhookLogs.slice(0, limit);
  }

  public clearWebhookLogs(): void {
    this.webhookLogs = [];
  }
}

export const store = new Store();

export type MessageSender = 'user' | 'contact' | 'system';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MediaType = 'image' | 'audio' | 'video' | 'document' | 'text';

export interface Message {
  id: string;
  chatId: string;
  text: string;
  sender: MessageSender;
  fromMe: boolean;
  timestamp: number;
  status: MessageStatus;
  mediaType?: MediaType;
  mediaUrl?: string;
  mediaName?: string;
  reaction?: string;
  replyToId?: string;
}

export interface Chat {
  id: string; // phone or jid, e.g., 5511999998888@s.whatsapp.net
  name: string;
  phone: string;
  avatar?: string;
  lastMessage?: {
    text: string;
    timestamp: number;
    fromMe: boolean;
    status: MessageStatus;
  };
  unreadCount: number;
  updatedAt: number;
  isOnline?: boolean;
  isTyping?: boolean;
  isGroup?: boolean;
  tags?: string[];
}

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  isConnected: boolean;
  state?: 'open' | 'connecting' | 'close' | 'refused' | 'unknown';
  qrCode?: string;
}

export interface N8nConfig {
  webhookUrl: string;
  webhookSecret?: string;
  enabled: boolean;
  forwardIncoming: boolean;
  forwardOutgoing: boolean;
  events: string[];
}

export interface FirebaseConfig {
  projectId: string;
  clientEmail?: string;
  privateKey?: string;
  isConfigured: boolean;
  storageBucket?: string;
}

export interface WebhookLog {
  id: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing';
  source: 'evolution' | 'n8n' | 'system' | 'client';
  event: string;
  url?: string;
  statusCode?: number;
  success: boolean;
  payload: any;
  response?: any;
  durationMs?: number;
}

export interface AppConfig {
  evolution: EvolutionConfig;
  n8n: N8nConfig;
  firebase: FirebaseConfig;
  appUrl: string;
}

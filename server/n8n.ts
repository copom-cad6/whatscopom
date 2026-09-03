import { Message, WebhookLog } from '../src/types.js';
import { store } from './store.js';

export async function sendWebhookToN8n(
  event: 'messages.upsert' | 'messages.send' | 'connection.update' | 'test',
  data: {
    message?: Message;
    chatId?: string;
    phone?: string;
    senderName?: string;
    extra?: any;
  }
): Promise<{ success: boolean; status?: number; response?: any; error?: string }> {
  const config = store.getConfig();
  const n8n = config.n8n;

  if (!n8n.enabled || !n8n.webhookUrl) {
    return { success: false, error: 'n8n webhook não configurado ou desabilitado' };
  }

  // Check filter
  if (event === 'messages.send' && !n8n.forwardOutgoing) {
    return { success: false, error: 'Encaminhamento de mensagens enviadas desabilitado' };
  }
  if (event === 'messages.upsert' && !n8n.forwardIncoming) {
    return { success: false, error: 'Encaminhamento de mensagens recebidas desabilitado' };
  }

  const startTime = Date.now();
  const payload = {
    event,
    instance: config.evolution.instanceName || 'atendimento',
    timestamp: new Date().toISOString(),
    chatId: data.chatId || data.message?.chatId,
    phone: data.phone || (data.chatId ? data.chatId.replace(/@.*$/, '') : ''),
    senderName: data.senderName,
    message: data.message
      ? {
          id: data.message.id,
          text: data.message.text,
          fromMe: data.message.fromMe,
          timestamp: data.message.timestamp,
          status: data.message.status,
          mediaType: data.message.mediaType,
          mediaUrl: data.message.mediaUrl,
          reaction: data.message.reaction
        }
      : undefined,
    extra: data.extra
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'ZapChat-Evolution-Node/1.0'
  };

  if (n8n.webhookSecret) {
    headers['X-Webhook-Secret'] = n8n.webhookSecret;
    headers['Authorization'] = `Bearer ${n8n.webhookSecret}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(n8n.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const durationMs = Date.now() - startTime;

    let responseData: any = null;
    try {
      const text = await res.text();
      responseData = text ? JSON.parse(text) : { status: res.statusText };
    } catch {
      responseData = { status: res.status };
    }

    const success = res.ok;

    store.addWebhookLog({
      direction: 'outgoing',
      source: 'n8n',
      event,
      url: n8n.webhookUrl,
      statusCode: res.status,
      success,
      payload,
      response: responseData,
      durationMs
    });

    return { success, status: res.status, response: responseData };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err?.name === 'AbortError' ? 'Timeout ao conectar com n8n (8s)' : (err?.message || 'Falha de rede');

    store.addWebhookLog({
      direction: 'outgoing',
      source: 'n8n',
      event,
      url: n8n.webhookUrl,
      statusCode: 0,
      success: false,
      payload,
      response: { error: errorMessage },
      durationMs
    });

    return { success: false, error: errorMessage };
  }
}

import { store } from './store.js';

export async function sendEvolutionTextMessage(phoneOrJid: string, text: string): Promise<any> {
  const config = store.getConfig();
  const { apiUrl, apiKey, instanceName } = config.evolution;

  // Clean phone number
  const cleanPhone = phoneOrJid.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/\D/g, '');

  if (!apiUrl || !apiKey || !instanceName) {
    return {
      simulated: true,
      message: 'Evolution API não configurada totalmente no momento. Mensagem armazenada localmente e enviada ao n8n.'
    };
  }

  const endpoint = `${apiUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instanceName)}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: text,
        options: {
          delay: 500,
          presence: 'composing'
        }
      })
    });

    const data = await res.json();
    return { success: res.ok, status: res.status, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao conectar à Evolution API' };
  }
}

export async function checkEvolutionConnection(): Promise<{
  connected: boolean;
  state: 'open' | 'connecting' | 'close' | 'refused' | 'unknown';
  qrCode?: string;
  error?: string;
}> {
  const config = store.getConfig();
  const { apiUrl, apiKey, instanceName } = config.evolution;

  if (!apiUrl || !apiKey || !instanceName) {
    return {
      connected: false,
      state: 'close',
      error: 'Preencha a URL, Chave de API e Nome da Instância da Evolution API.'
    };
  }

  const cleanUrl = apiUrl.replace(/\/$/, '');
  const endpoint = `${cleanUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { apikey: apiKey }
    });

    if (!res.ok) {
      // Try connect endpoint to fetch qr
      const connectRes = await fetch(`${cleanUrl}/instance/connect/${encodeURIComponent(instanceName)}`, {
        method: 'GET',
        headers: { apikey: apiKey }
      });
      if (connectRes.ok) {
        const connData: any = await connectRes.json();
        const qr = connData?.base64 || connData?.qrcode?.base64 || connData?.code;
        return {
          connected: false,
          state: 'connecting',
          qrCode: qr
        };
      }

      return {
        connected: false,
        state: 'close',
        error: `Evolution API retornou status HTTP ${res.status}`
      };
    }

    const data: any = await res.json();
    const state = data?.instance?.state || data?.state || (res.ok ? 'open' : 'close');
    const isConnected = state === 'open';

    // Update store state
    store.updateConfig({
      evolution: {
        ...config.evolution,
        isConnected,
        state
      }
    });

    return {
      connected: isConnected,
      state: isConnected ? 'open' : state
    };
  } catch (err: any) {
    return {
      connected: false,
      state: 'refused',
      error: `Não foi possível alcançar a Evolution API (${err?.message})`
    };
  }
}

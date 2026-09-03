import React, { useState } from 'react';
import {
  X,
  Zap,
  Server,
  Database,
  Activity,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Send,
  Terminal,
  ExternalLink,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { AppConfig, WebhookLog } from '../types';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig | null;
  logs: WebhookLog[];
  onUpdateConfig: (partial: Partial<AppConfig>) => Promise<void>;
  onTestEvolution: () => Promise<any>;
  onTestN8n: () => Promise<any>;
  onClearLogs: () => Promise<void>;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  config,
  logs,
  onUpdateConfig,
  onTestEvolution,
  onTestN8n,
  onClearLogs
}) => {
  const [activeTab, setActiveTab] = useState<'evolution' | 'n8n' | 'firebase' | 'logs'>('n8n');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form states
  const [evoUrl, setEvoUrl] = useState(config?.evolution.apiUrl || '');
  const [evoKey, setEvoKey] = useState(config?.evolution.apiKey || '');
  const [evoInstance, setEvoInstance] = useState(config?.evolution.instanceName || 'atendimento');

  const [n8nUrl, setN8nUrl] = useState(config?.n8n.webhookUrl || '');
  const [n8nSecret, setN8nSecret] = useState(config?.n8n.webhookSecret || '');
  const [n8nEnabled, setN8nEnabled] = useState(config?.n8n.enabled ?? true);
  const [n8nIncoming, setN8nIncoming] = useState(config?.n8n.forwardIncoming ?? true);
  const [n8nOutgoing, setN8nOutgoing] = useState(config?.n8n.forwardOutgoing ?? true);

  const [fbProjectId, setFbProjectId] = useState(config?.firebase.projectId || '');
  const [fbEmail, setFbEmail] = useState(config?.firebase.clientEmail || '');
  const [fbKey, setFbKey] = useState('');

  // Status & test feedbacks
  const [testingEvo, setTestingEvo] = useState(false);
  const [evoResult, setEvoResult] = useState<any>(null);

  const [testingN8n, setTestingN8n] = useState(false);
  const [n8nResult, setN8nResult] = useState<any>(null);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const evolutionWebhookUrl = `${currentOrigin}/api/webhook/evolution`;
  const n8nIncomingWebhookUrl = `${currentOrigin}/api/webhook/n8n/send`;

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await onUpdateConfig({
        evolution: {
          apiUrl: evoUrl,
          apiKey: evoKey,
          instanceName: evoInstance,
          isConnected: config?.evolution.isConnected || false
        },
        n8n: {
          webhookUrl: n8nUrl,
          webhookSecret: n8nSecret,
          enabled: n8nEnabled,
          forwardIncoming: n8nIncoming,
          forwardOutgoing: n8nOutgoing,
          events: ['messages.upsert', 'messages.send', 'connection.update']
        },
        firebase: {
          projectId: fbProjectId,
          clientEmail: fbEmail,
          privateKey: fbKey || undefined,
          isConfigured: Boolean(fbProjectId && fbEmail)
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEvolution = async () => {
    setTestingEvo(true);
    setEvoResult(null);
    try {
      const res = await onTestEvolution();
      setEvoResult(res);
    } catch (err: any) {
      setEvoResult({ connected: false, error: err?.message });
    } finally {
      setTestingEvo(false);
    }
  };

  const handleTestN8n = async () => {
    setTestingN8n(true);
    setN8nResult(null);
    try {
      const res = await onTestN8n();
      setN8nResult(res);
    } catch (err: any) {
      setN8nResult({ success: false, error: err?.message });
    } finally {
      setTestingN8n(false);
    }
  };

  return (
    <div id="integrations-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#111b21] border border-[#222d34] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="bg-[#202c33] px-6 py-4 flex items-center justify-between border-b border-[#222d34] flex-shrink-0">
          <div className="flex items-center gap-2.5 text-[#e9edef]">
            <Zap className="w-5 h-5 text-[#00a884]" />
            <div>
              <h2 className="font-semibold text-base">Central de Integrações & VPS</h2>
              <p className="text-xs text-[#8696a0]">Evolution API, Webhooks n8n, Firebase e Deploy na VPS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#222d34] bg-[#182229] px-6 gap-6 text-sm font-medium flex-shrink-0">
          <button
            onClick={() => setActiveTab('n8n')}
            className={`py-3 flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'n8n'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Webhook n8n</span>
            {config?.n8n.enabled && config?.n8n.webhookUrl && (
              <span className="w-2 h-2 rounded-full bg-[#00a884]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('evolution')}
            className={`py-3 flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'evolution'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Evolution API</span>
            {config?.evolution.isConnected ? (
              <span className="w-2 h-2 rounded-full bg-[#00a884]" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`py-3 flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'firebase'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Firebase & VPS</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'logs'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Monitor de Webhooks ({logs.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {/* TAB 1: n8n WEBHOOK */}
          {activeTab === 'n8n' && (
            <div className="space-y-5">
              <div className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#e9edef] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#00a884]" />
                    Disparo Automático para o seu n8n
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={n8nEnabled}
                      onChange={(e) => setN8nEnabled(e.target.checked)}
                      className="accent-[#00a884] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-[#e9edef]">Ativar Envio</span>
                  </label>
                </div>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  Todas as mensagens que chegarem do WhatsApp via Evolution API e as enviadas pelo atendente são postadas diretamente no seu n8n via HTTP POST em formato JSON.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1">
                    URL do Webhook no seu n8n (POST) *
                  </label>
                  <input
                    type="url"
                    value={n8nUrl}
                    onChange={(e) => setN8nUrl(e.target.value)}
                    placeholder="https://n8n.seudominio.com/webhook/whatsapp-evolution"
                    className="w-full bg-[#111b21] border border-[#2a3942] focus:border-[#00a884] rounded-lg px-3.5 py-2.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1">
                    Token Secreto do Webhook (Opcional - enviado no header X-Webhook-Secret)
                  </label>
                  <input
                    type="password"
                    value={n8nSecret}
                    onChange={(e) => setN8nSecret(e.target.value)}
                    placeholder="ex: token_super_secreto_n8n"
                    className="w-full bg-[#111b21] border border-[#2a3942] focus:border-[#00a884] rounded-lg px-3.5 py-2.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#111b21] border border-[#2a3942] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={n8nIncoming}
                      onChange={(e) => setN8nIncoming(e.target.checked)}
                      className="accent-[#00a884] w-4 h-4 cursor-pointer"
                    />
                    <div className="text-xs">
                      <p className="text-[#e9edef] font-medium">Encaminhar Mensagens Recebidas</p>
                      <p className="text-[#8696a0] text-[11px]">Dispara quando o cliente mandar mensagem</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#111b21] border border-[#2a3942] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={n8nOutgoing}
                      onChange={(e) => setN8nOutgoing(e.target.checked)}
                      className="accent-[#00a884] w-4 h-4 cursor-pointer"
                    />
                    <div className="text-xs">
                      <p className="text-[#e9edef] font-medium">Encaminhar Mensagens Enviadas</p>
                      <p className="text-[#8696a0] text-[11px]">Dispara quando você responder no chat</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Test Button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestN8n}
                  disabled={testingN8n || !n8nUrl}
                  className="px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] border border-[#00a884]/40 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${testingN8n ? 'animate-spin' : ''}`} />
                  {testingN8n ? 'Disparando teste...' : 'Testar Disparo para o n8n'}
                </button>
              </div>

              {/* Test Result Display */}
              {n8nResult && (
                <div
                  className={`p-3 rounded-lg border text-xs font-mono ${
                    n8nResult.success
                      ? 'bg-[#00a884]/15 border-[#00a884]/40 text-[#00a884]'
                      : 'bg-red-500/15 border-red-500/40 text-red-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {n8nResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>
                      {n8nResult.success
                        ? `Webhook n8n recebeu com Sucesso (HTTP ${n8nResult.status || 200})!`
                        : `Falha ao alcançar n8n: ${n8nResult.error || 'Erro de conexão'}`}
                    </span>
                  </div>
                  {n8nResult.response && (
                    <pre className="text-[11px] overflow-x-auto mt-1 p-2 bg-black/30 rounded">
                      {JSON.stringify(n8nResult.response, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {/* Incoming Endpoint for n8n */}
              <div className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-2">
                <h4 className="text-xs font-semibold text-[#e9edef] flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#00a884]" />
                  Endpoint para o n8n Enviar Mensagens de volta (Opcional)
                </h4>
                <p className="text-[11px] text-[#8696a0]">
                  Caso queira que seu fluxo do n8n responda automaticamente no chat ou mande mensagens:
                </p>
                <div className="flex items-center gap-2 bg-[#202c33] px-3 py-2 rounded-lg border border-[#2a3942]">
                  <span className="font-mono text-xs text-[#00a884] truncate flex-1">{n8nIncomingWebhookUrl}</span>
                  <button
                    onClick={() => copyToClipboard(n8nIncomingWebhookUrl, 'n8nIncomingUrl')}
                    className="text-[#8696a0] hover:text-[#e9edef] p-1 cursor-pointer"
                    title="Copiar URL"
                  >
                    {copiedField === 'n8nIncomingUrl' ? <Check className="w-4 h-4 text-[#00a884]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Webhook de Verificação de Instância na Tela de Acesso */}
              <div className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-2">
                <h4 className="text-xs font-semibold text-[#e9edef] flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#00a884]" />
                  Webhook de Verificação de Instância (Acesso Inicial)
                </h4>
                <p className="text-[11px] text-[#8696a0]">
                  Quando o usuário clica em &quot;Acessar&quot; informando Nome e Telefone, o sistema envia o evento <code className="text-[#00a884] font-mono">instance.check</code> para seu n8n. O n8n pode retornar diretamente:
                </p>
                <div className="bg-[#202c33] p-3 rounded-lg border border-[#2a3942] font-mono text-[11px] text-[#aebac1] overflow-x-auto">
                  <pre>{`{
  "status": "open", // ou "close"
  "qrcode": "base64_do_qrcode_se_close",
  "code": "1234-5678" // código copia e cola
}`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVOLUTION API */}
          {activeTab === 'evolution' && (
            <div className="space-y-5">
              <div className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-2">
                <h3 className="text-sm font-semibold text-[#e9edef] flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#00a884]" />
                  Conexão com a Evolution API
                </h3>
                <p className="text-xs text-[#8696a0]">
                  Conecte com sua instância da Evolution API (v1 ou v2) hospedada na sua VPS ou servidor externo.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1">
                    URL Base da Evolution API *
                  </label>
                  <input
                    type="url"
                    value={evoUrl}
                    onChange={(e) => setEvoUrl(e.target.value)}
                    placeholder="https://evolution.seudominio.com"
                    className="w-full bg-[#111b21] border border-[#2a3942] focus:border-[#00a884] rounded-lg px-3.5 py-2.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8696a0] mb-1">
                      Chave de API (ApiKey / Global Key) *
                    </label>
                    <input
                      type="password"
                      value={evoKey}
                      onChange={(e) => setEvoKey(e.target.value)}
                      placeholder="Sua Global ApiKey"
                      className="w-full bg-[#111b21] border border-[#2a3942] focus:border-[#00a884] rounded-lg px-3.5 py-2.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8696a0] mb-1">
                      Nome da Instância *
                    </label>
                    <input
                      type="text"
                      value={evoInstance}
                      onChange={(e) => setEvoInstance(e.target.value)}
                      placeholder="atendimento"
                      className="w-full bg-[#111b21] border border-[#2a3942] focus:border-[#00a884] rounded-lg px-3.5 py-2.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestEvolution}
                    disabled={testingEvo}
                    className="px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] border border-[#00a884]/40 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingEvo ? 'animate-spin' : ''}`} />
                    {testingEvo ? 'Consultando...' : 'Consultar Estado da Instância'}
                  </button>
                </div>

                {evoResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs font-mono ${
                      evoResult.connected
                        ? 'bg-[#00a884]/15 border-[#00a884]/40 text-[#00a884]'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    <p className="font-bold">
                      Status da Instância: {evoResult.state?.toUpperCase() || (evoResult.connected ? 'ONLINE' : 'DESCONECTADA')}
                    </p>
                    {evoResult.error && <p className="text-red-400 mt-1">{evoResult.error}</p>}
                    {evoResult.qrCode && (
                      <div className="mt-2 text-center bg-white p-2 rounded max-w-[200px] mx-auto">
                        <img
                          src={evoResult.qrCode.startsWith('data:') ? evoResult.qrCode : `data:image/png;base64,${evoResult.qrCode}`}
                          alt="QR Code WhatsApp"
                          className="w-full h-auto"
                        />
                        <span className="text-[10px] text-neutral-800 font-sans block mt-1">Escaneie com seu WhatsApp</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Evolution Webhook URL info */}
                <div className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-2 mt-4">
                  <h4 className="text-xs font-semibold text-[#e9edef] flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-[#00a884]" />
                    URL do Webhook para colar na Evolution API
                  </h4>
                  <p className="text-[11px] text-[#8696a0]">
                    No painel da Evolution API ou via requisição <code>POST /webhook/set/{'{instance}'}</code>, configure este webhook para receber as mensagens em tempo real:
                  </p>
                  <div className="flex items-center gap-2 bg-[#202c33] px-3 py-2 rounded-lg border border-[#2a3942]">
                    <span className="font-mono text-xs text-[#00a884] truncate flex-1">{evolutionWebhookUrl}</span>
                    <button
                      onClick={() => copyToClipboard(evolutionWebhookUrl, 'evoWebhookUrl')}
                      className="text-[#8696a0] hover:text-[#e9edef] p-1 cursor-pointer"
                      title="Copiar URL"
                    >
                      {copiedField === 'evoWebhookUrl' ? <Check className="w-4 h-4 text-[#00a884]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FIREBASE & VPS */}
          {activeTab === 'firebase' && (
            <div className="space-y-5">
              <div className="bg-[#111b21] p-4 rounded-xl border border-[#222d34] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#e9edef] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#00a884]" />
                    Firebase Conectado (Projeto: whats-cad)
                  </h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></span>
                    Configurado & Ativo
                  </span>
                </div>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  Credenciais oficiais do Firebase (SDK Web e Firestore) vinculadas ao projeto <span className="text-[#e9edef] font-mono">whats-cad</span>.
                </p>
              </div>

              {/* Firebase Active Config Overview */}
              <div className="bg-[#111b21] p-4 rounded-xl border border-[#222d34] space-y-3">
                <h4 className="text-xs font-semibold text-[#e9edef] flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00a884]" />
                  Configuração Web do Firebase (whats-cad)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-[#202c33] p-2.5 rounded-lg border border-[#222d34]">
                    <span className="text-[#8696a0] block text-[10px]">projectId</span>
                    <span className="text-[#e9edef] select-all">whats-cad</span>
                  </div>
                  <div className="bg-[#202c33] p-2.5 rounded-lg border border-[#222d34]">
                    <span className="text-[#8696a0] block text-[10px]">authDomain</span>
                    <span className="text-[#e9edef] select-all">whats-cad.firebaseapp.com</span>
                  </div>
                  <div className="bg-[#202c33] p-2.5 rounded-lg border border-[#222d34]">
                    <span className="text-[#8696a0] block text-[10px]">storageBucket</span>
                    <span className="text-[#e9edef] select-all">whats-cad.firebasestorage.app</span>
                  </div>
                  <div className="bg-[#202c33] p-2.5 rounded-lg border border-[#222d34]">
                    <span className="text-[#8696a0] block text-[10px]">messagingSenderId</span>
                    <span className="text-[#e9edef] select-all">153886856889</span>
                  </div>
                  <div className="bg-[#202c33] p-2.5 rounded-lg border border-[#222d34] sm:col-span-2">
                    <span className="text-[#8696a0] block text-[10px]">appId</span>
                    <span className="text-[#e9edef] select-all text-[11px]">1:153886856889:web:e2c95f4364cca561f96d68</span>
                  </div>
                </div>
              </div>

              {/* Ready-to-copy VPS Deployment Guide with npm install */}
              <div className="bg-[#111b21] p-4 rounded-xl border border-[#222d34] space-y-3">
                <h4 className="text-xs font-semibold text-[#e9edef] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#00a884]" />
                  Comandos Prontos para sua VPS (Dockerfile com npm install)
                </h4>
                <p className="text-[11px] text-[#8696a0]">
                  O <code>Dockerfile</code> foi atualizado com <code>RUN npm install</code> conforme solicitado para evitar falhas de dependência na sua VPS.
                </p>

                <div className="bg-[#0b141a] p-3 rounded-lg border border-[#222d34] text-[11px] font-mono text-[#aebac1] space-y-2">
                  <p className="text-[#00a884]"># 1. Subir via Docker Compose (Porta 3000)</p>
                  <p className="select-all">docker compose up -d --build</p>
                  
                  <p className="text-[#00a884] pt-2"># 2. Ou rodar diretamente com Node/PM2</p>
                  <p className="select-all">npm install && npm run build && pm2 start ecosystem.config.cjs</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WEBHOOK LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#e9edef] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00a884]" />
                    Monitor de Webhooks em Tempo Real
                  </h3>
                  <p className="text-xs text-[#8696a0]">
                    Histórico de disparos enviados para o n8n e recebidos da Evolution API.
                  </p>
                </div>
                {logs.length > 0 && (
                  <button
                    onClick={onClearLogs}
                    className="px-3 py-1.5 text-xs rounded bg-[#202c33] hover:bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar Logs
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center text-[#8696a0] bg-[#111b21] rounded-xl border border-[#2a3942]">
                  Nenhum registro de webhook ainda. Envie uma mensagem ou use o botão "Testar Disparo para o n8n"!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-[#111b21] border border-[#2a3942] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              log.direction === 'outgoing'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-[#00a884]/20 text-[#00a884]'
                            }`}
                          >
                            {log.direction === 'outgoing' ? 'SAÍDA -> N8N' : 'ENTRADA <- EVOLUTION'}
                          </span>
                          <span className="font-semibold text-[#e9edef]">{log.event}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#8696a0]">
                          <span
                            className={`font-mono font-bold ${
                              log.success ? 'text-[#00a884]' : 'text-red-400'
                            }`}
                          >
                            {log.statusCode ? `HTTP ${log.statusCode}` : log.success ? 'OK' : 'ERRO'}
                          </span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                        </div>
                      </div>

                      {log.url && (
                        <p className="text-[11px] text-[#8696a0] font-mono truncate">
                          URL: {log.url}
                        </p>
                      )}

                      <details className="cursor-pointer">
                        <summary className="text-[11px] text-[#00a884] hover:underline font-mono">
                          Ver Payload JSON
                        </summary>
                        <pre className="mt-1.5 p-2 bg-[#0b141a] rounded text-[10px] font-mono text-[#aebac1] overflow-x-auto max-h-36">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#202c33] px-6 py-4 flex items-center justify-between border-t border-[#222d34] flex-shrink-0">
          <div className="text-xs text-[#8696a0]">
            {savedSuccess && (
              <span className="text-[#00a884] flex items-center gap-1.5 font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Configurações salvas e aplicadas!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#202c33] border border-[#222d34] text-[#e9edef] text-xs hover:bg-[#2a3942] cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

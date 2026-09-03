import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Lock,
  QrCode,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  User,
  Zap,
  CheckCircle2,
  Smartphone,
  ChevronRight,
  HelpCircle,
  Radio
} from 'lucide-react';
import { UserSession, InstanceCheckResponse } from '../types';
import { Socket } from 'socket.io-client';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
  socket: Socket | null;
  onOpenIntegrations?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  socket,
  onOpenIntegrations
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Connection state once checked
  const [step, setStep] = useState<'form' | 'connect'>('form');
  const [connectMethod, setConnectMethod] = useState<'qrcode' | 'code'>('qrcode');
  const [instanceData, setInstanceData] = useState<InstanceCheckResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(60);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  // Phone input formatting helper
  const handlePhoneChange = (val: string) => {
    // Keep digits only
    const digits = val.replace(/\D/g, '');
    let formatted = val;

    if (digits.length <= 2) {
      formatted = digits.length > 0 ? `(${digits}` : '';
    } else if (digits.length <= 6) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 10) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }

    setPhone(formatted);
    if (error) setError('');
  };

  // Listen for socket instance updates (e.g. from webhook callback or phone scan)
  useEffect(() => {
    if (!socket) return;

    const handleInstanceStatus = (data: { phone: string; status: 'open' | 'close' }) => {
      const cleanInput = phone.replace(/\D/g, '');
      const fullInput = cleanInput.length >= 10 && !cleanInput.startsWith('55') ? `55${cleanInput}` : cleanInput;

      if (data.phone === fullInput && data.status === 'open') {
        setConnectionSuccess(true);
        setTimeout(() => {
          onLoginSuccess({
            name: name.trim() || 'Usuário WhatsApp',
            phone: fullInput,
            status: 'open',
            connectedAt: Date.now()
          });
        }, 1200);
      }
    };

    socket.on('instance:status', handleInstanceStatus);
    return () => {
      socket.off('instance:status', handleInstanceStatus);
    };
  }, [socket, phone, name, onLoginSuccess]);

  // Countdown for QR Code refresh
  useEffect(() => {
    if (step !== 'connect' || connectionSuccess) return;

    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          // Auto refresh
          refreshCheck(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, connectionSuccess, name, phone]);

  // Submit form and trigger webhook check
  const handleAccess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanPhone = phone.replace(/\D/g, '');
    if (!name.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }
    if (cleanPhone.length < 10) {
      setError('Informe um número de telefone com DDD válido (mínimo 10 dígitos).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/check-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao verificar instância no webhook.');
      }

      const data: InstanceCheckResponse = await res.json();
      setInstanceData(data);

      if (data.status === 'open') {
        // Already connected! Access chats directly
        setConnectionSuccess(true);
        setTimeout(() => {
          onLoginSuccess({
            name: name.trim(),
            phone: data.phone || cleanPhone,
            status: 'open',
            connectedAt: Date.now()
          });
        }, 1000);
      } else {
        // Disconnected: show QR code / pairing code
        setStep('connect');
        setQrCountdown(60);
      }
    } catch (err: any) {
      setError(err?.message || 'Falha na comunicação com o webhook. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Recheck instance status
  const refreshCheck = async (showLoading = true) => {
    if (showLoading) setCheckingStatus(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await fetch('/api/auth/check-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone
        })
      });

      if (res.ok) {
        const data: InstanceCheckResponse = await res.json();
        setInstanceData(data);

        if (data.status === 'open') {
          setConnectionSuccess(true);
          setTimeout(() => {
            onLoginSuccess({
              name: name.trim(),
              phone: data.phone || cleanPhone,
              status: 'open',
              connectedAt: Date.now()
            });
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      if (showLoading) setCheckingStatus(false);
    }
  };

  // Simulate successful connection (for quick dev/demo testing without physical scanner)
  const handleSimulateConnection = async () => {
    setCheckingStatus(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await fetch('/api/auth/simulate-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });

      if (res.ok) {
        setConnectionSuccess(true);
        setTimeout(() => {
          onLoginSuccess({
            name: name.trim() || 'Usuário WhatsApp',
            phone: cleanPhone,
            status: 'open',
            connectedAt: Date.now()
          });
        }, 1000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Copy pairing code
  const handleCopyCode = () => {
    if (instanceData?.code) {
      navigator.clipboard.writeText(instanceData.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div
      id="login-screen-root"
      className="min-h-screen w-full bg-[#0b141a] text-[#e9edef] flex flex-col justify-between relative overflow-hidden select-none font-sans"
    >
      {/* Background visual texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none elegant-dark-pattern" />

      {/* Subtle glowing ambient gradient behind center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00a884]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 border-b border-[#222d34] bg-[#111b21]/90 backdrop-blur-md px-6 md:px-12 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00a884] flex items-center justify-center text-white shadow-md shadow-[#00a884]/20">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-[#e9edef] text-base">
                ZapChat Web
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30">
                Evolution & n8n
              </span>
            </div>
            <p className="text-[11px] text-[#8696a0]">
              Ambiente Seguro de Atendimento Multi-Instância
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenIntegrations && (
            <button
              onClick={onOpenIntegrations}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] border border-[#222d34] text-[#aebac1] hover:text-[#e9edef] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#00a884]" />
              <span className="hidden sm:inline">Configurar</span> Integrações
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-[#8696a0] bg-[#111b21] px-3 py-1.5 rounded-lg border border-[#222d34]">
            <Lock className="w-3.5 h-3.5 text-[#00a884]" />
            <span className="hidden sm:inline">Conexão Segura</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        {step === 'form' ? (
          /* ============================================================ */
          /* STEP 1: INITIAL FORM (NOME E TELEFONE APENAS)                */
          /* ============================================================ */
          <div className="w-full max-w-md animate-fade-in">
            <div className="bg-[#111b21] border border-[#222d34] rounded-2xl p-7 md:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
              {/* Header inside card */}
              <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-[#202c33] border border-[#222d34] flex items-center justify-center mx-auto mb-4 text-[#00a884] shadow-inner">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h1 className="text-xl md:text-2xl font-semibold text-[#e9edef] tracking-tight">
                  Acessar WhatsApp Web
                </h1>
                <p className="text-xs md:text-sm text-[#8696a0] mt-1.5 leading-relaxed">
                  Informe seus dados para verificar ou iniciar a conexão da sua instância via webhook.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleAccess} className="space-y-4">
                {/* Nome */}
                <div>
                  <label
                    htmlFor="input-auth-name"
                    className="block text-xs font-medium text-[#8696a0] mb-1.5"
                  >
                    Seu Nome ou Identificação
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8696a0]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="input-auth-name"
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva / Atendimento"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError('');
                      }}
                      className="w-full bg-[#202c33] border border-[#222d34] focus:border-[#00a884] rounded-xl pl-10 pr-3.5 py-3 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label
                    htmlFor="input-auth-phone"
                    className="block text-xs font-medium text-[#8696a0] mb-1.5"
                  >
                    Número do WhatsApp (DDD + Número)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8696a0]">
                      <span className="text-xs font-medium text-[#00a884] mr-1">🇧🇷 +55</span>
                    </div>
                    <input
                      id="input-auth-phone"
                      type="tel"
                      required
                      placeholder="(11) 98765-4321"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full bg-[#202c33] border border-[#222d34] focus:border-[#00a884] rounded-xl pl-18 pr-3.5 py-3 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none font-mono transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-[#8696a0] mt-1.5">
                    O sistema disparará um webhook para checar se a instância já está ativa.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Action Button */}
                <button
                  id="btn-auth-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#00a884] hover:bg-[#02906f] active:bg-[#007a5e] text-white font-medium text-sm transition-all shadow-lg shadow-[#00a884]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Consultando webhook de instância...</span>
                    </>
                  ) : (
                    <>
                      <span>Acessar WhatsApp</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer info inside card */}
              <div className="mt-6 pt-5 border-t border-[#222d34] flex items-center justify-center gap-2 text-[11px] text-[#8696a0]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
                <span>Verificação automatizada via Evolution API & n8n</span>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* STEP 2: STATUS CLOSE -> QR CODE & PAIRING CODE               */
          /* ============================================================ */
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="bg-[#111b21] border border-[#222d34] rounded-2xl shadow-2xl shadow-black/70 overflow-hidden">
              {/* Header */}
              <div className="bg-[#202c33] px-6 py-4 border-b border-[#222d34] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <div>
                    <h2 className="text-sm md:text-base font-semibold text-[#e9edef]">
                      Conectar WhatsApp
                    </h2>
                    <p className="text-xs text-[#8696a0]">
                      Instância desconectada ({name} • {phone})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setStep('form')}
                  className="text-xs text-[#8696a0] hover:text-[#e9edef] underline cursor-pointer"
                >
                  Trocar dados
                </button>
              </div>

              {/* Success Banner if status just changed to open */}
              {connectionSuccess && (
                <div className="bg-[#00a884]/20 border-b border-[#00a884]/40 px-6 py-3 flex items-center justify-center gap-2 text-sm text-[#00a884] font-medium animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 animate-bounce" />
                  <span>Instância conectada com sucesso! Acessando suas conversas...</span>
                </div>
              )}

              {/* Body */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Method selector tabs */}
                <div className="flex rounded-xl bg-[#202c33] p-1 border border-[#222d34] max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => setConnectMethod('qrcode')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      connectMethod === 'qrcode'
                        ? 'bg-[#111b21] text-[#00a884] shadow-sm'
                        : 'text-[#8696a0] hover:text-[#e9edef]'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Ler QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConnectMethod('code')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      connectMethod === 'code'
                        ? 'bg-[#111b21] text-[#00a884] shadow-sm'
                        : 'text-[#8696a0] hover:text-[#e9edef]'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Código de Conexão</span>
                  </button>
                </div>

                {/* TAB 1: QR CODE VIEW */}
                {connectMethod === 'qrcode' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Left: QR Code Box */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative p-3 bg-white rounded-2xl shadow-xl border-4 border-[#202c33]">
                        {instanceData?.qrcode ? (
                          <img
                            src={
                              instanceData.qrcode.startsWith('data:')
                                ? instanceData.qrcode
                                : `data:image/png;base64,${instanceData.qrcode}`
                            }
                            alt="WhatsApp Web QR Code"
                            className="w-56 h-56 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-56 h-56 flex flex-col items-center justify-center text-neutral-800">
                            <RefreshCw className="w-8 h-8 animate-spin text-[#00a884] mb-2" />
                            <span className="text-xs font-medium">Gerando QR Code...</span>
                          </div>
                        )}

                        {/* Scanner sweep effect */}
                        <div className="absolute inset-x-3 top-3 h-0.5 bg-[#00a884] opacity-75 shadow-lg shadow-[#00a884] animate-pulse" />
                      </div>

                      <div className="flex items-center gap-2 mt-3 text-xs text-[#8696a0]">
                        <RefreshCw className="w-3.5 h-3.5 text-[#00a884]" />
                        <span>Atualização automática em {qrCountdown}s</span>
                        <button
                          onClick={() => refreshCheck(true)}
                          disabled={checkingStatus}
                          className="text-[#00a884] hover:underline font-medium cursor-pointer ml-1"
                        >
                          {checkingStatus ? 'Atualizando...' : 'Recarregar'}
                        </button>
                      </div>
                    </div>

                    {/* Right: Step-by-step instructions */}
                    <div className="space-y-4 text-xs md:text-sm">
                      <h3 className="font-semibold text-[#e9edef] text-base flex items-center gap-2">
                        <span>Como conectar com seu celular:</span>
                      </h3>

                      <ol className="space-y-3 text-[#aebac1]">
                        <li className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#202c33] border border-[#222d34] flex items-center justify-center text-[#00a884] font-bold text-xs flex-shrink-0">
                            1
                          </span>
                          <span>Abra o <strong>WhatsApp</strong> no seu aparelho celular.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#202c33] border border-[#222d34] flex items-center justify-center text-[#00a884] font-bold text-xs flex-shrink-0">
                            2
                          </span>
                          <span>
                            Toque em <strong>Mais opções</strong> (⋮ no Android) ou <strong>Configurações</strong> (⚙️ no iPhone).
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#202c33] border border-[#222d34] flex items-center justify-center text-[#00a884] font-bold text-xs flex-shrink-0">
                            3
                          </span>
                          <span>
                            Toque em <strong>Aparelhos conectados</strong> e depois em <strong>Conectar um aparelho</strong>.
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#202c33] border border-[#222d34] flex items-center justify-center text-[#00a884] font-bold text-xs flex-shrink-0">
                            4
                          </span>
                          <span>
                            Aponte a câmera do seu celular para este QR Code para emparelhar.
                          </span>
                        </li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* TAB 2: PAIRING CODE VIEW */}
                {connectMethod === 'code' && (
                  <div className="max-w-lg mx-auto space-y-6 text-center">
                    <div>
                      <span className="text-xs text-[#8696a0] block mb-2 font-medium">
                        Código de Pareamento com o Número
                      </span>

                      <div className="bg-[#202c33] border-2 border-[#00a884]/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 shadow-xl">
                        <span className="text-3xl md:text-4xl font-mono tracking-widest text-[#00a884] font-bold select-all">
                          {instanceData?.code || 'GERANDO...'}
                        </span>

                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="px-5 py-2.5 rounded-xl bg-[#111b21] hover:bg-[#2a3942] border border-[#222d34] text-[#e9edef] text-xs font-medium transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-4 h-4 text-[#00a884]" />
                              <span className="text-[#00a884] font-semibold">Código copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-[#8696a0]" />
                              <span>Copiar Código</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#202c33]/50 p-4 rounded-xl border border-[#222d34] text-left text-xs text-[#aebac1] space-y-2">
                      <div className="font-semibold text-[#e9edef] flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-[#00a884]" />
                        <span>Passo a passo no seu WhatsApp:</span>
                      </div>
                      <p>
                        1. Abra <strong>WhatsApp</strong> &gt; <strong>Aparelhos conectados</strong>.
                      </p>
                      <p>
                        2. Toque em <strong>Conectar um aparelho</strong> e selecione <strong>Conectar com número de telefone</strong>.
                      </p>
                      <p>
                        3. Digite o código de 8 dígitos exibido acima para concluir a autenticação.
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom Actions Bar */}
                <div className="pt-4 border-t border-[#222d34] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#8696a0]">
                    <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
                    <span>Aguardando leitura do WhatsApp via webhook...</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => refreshCheck(true)}
                      disabled={checkingStatus}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#202c33] hover:bg-[#2a3942] border border-[#222d34] text-[#e9edef] text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
                      <span>Verificar Status</span>
                    </button>

                    {/* Developer helper simulation */}
                    <button
                      type="button"
                      onClick={handleSimulateConnection}
                      disabled={checkingStatus}
                      title="Simular que o usuário escaneou o QR Code (para testes rápidos em desenvolvimento)"
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#00a884]/20 hover:bg-[#00a884]/30 border border-[#00a884]/40 text-[#00a884] text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Simular Conexão</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-[#222d34] bg-[#111b21]/70 backdrop-blur-md text-center text-xs text-[#8696a0] z-10">
        <p>
          ZapChat Web Enterprise • Integrado com Evolution API, n8n Webhooks e Firebase Firestore
        </p>
      </footer>
    </div>
  );
};

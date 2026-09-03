import React from 'react';
import { MessageSquarePlus, Zap, Radio, BellRing, Settings2, ShieldCheck, LogOut, User } from 'lucide-react';
import { AppConfig, UserSession } from '../types';

interface SidebarHeaderProps {
  config: AppConfig | null;
  socketConnected: boolean;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onNewChat: () => void;
  onSimulate: () => void;
  onOpenIntegrations: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  config,
  socketConnected,
  currentUser,
  onLogout,
  onNewChat,
  onSimulate,
  onOpenIntegrations,
}) => {
  const isEvolutionConnected = config?.evolution.isConnected || currentUser?.status === 'open';
  const isN8nConfigured = Boolean(config?.n8n.webhookUrl && config?.n8n.enabled);

  return (
    <div id="sidebar-header" className="h-[64px] bg-[#202c33] px-3 md:px-4 flex items-center justify-between border-r border-[#222d34] select-none flex-shrink-0">
      {/* User profile & status pill */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#111b21] border border-[#222d34] flex items-center justify-center overflow-hidden">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'ZapChat')}&backgroundColor=00a884`}
              alt="Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span
            title={socketConnected ? 'Instância Conectada em Tempo Real' : 'Desconectado'}
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#202c33] ${
              socketConnected ? 'bg-[#00a884]' : 'bg-amber-500'
            }`}
          />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sm font-medium text-[#e9edef] truncate">
              {currentUser?.name || 'ZapChat Atendimento'}
            </span>
            <span className="text-[10px] text-[#00a884] font-medium bg-[#00a884]/15 px-1.5 py-0.2 rounded border border-[#00a884]/30 flex-shrink-0">
              Online
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-[11px] text-[#8696a0] truncate">
            <span className="font-mono truncate">
              {currentUser?.phone ? `+${currentUser.phone}` : 'Instância Ativa'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 flex-shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${isN8nConfigured ? 'bg-indigo-400' : 'bg-[#00a884]'}`} />
              n8n: {isN8nConfigured ? 'Ativo' : 'Standby'}
            </span>
          </div>
        </div>
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-1 text-[#aebac1] flex-shrink-0 ml-2">
        <button
          id="btn-simulate-msg"
          onClick={onSimulate}
          title="Simular Mensagem Recebida (Testar Webhooks e n8n)"
          className="p-2 rounded-full hover:bg-[#374248] hover:text-[#e9edef] transition-colors cursor-pointer relative"
        >
          <BellRing className="w-4.5 h-4.5 text-amber-400" />
        </button>

        <button
          id="btn-new-chat"
          onClick={onNewChat}
          title="Nova Conversa WhatsApp"
          className="p-2 rounded-full hover:bg-[#374248] hover:text-[#e9edef] transition-colors cursor-pointer"
        >
          <MessageSquarePlus className="w-4.5 h-4.5" />
        </button>

        <button
          id="btn-open-integrations"
          onClick={onOpenIntegrations}
          title="Central de Integrações (Evolution API, n8n, Firebase)"
          className="p-2 rounded-full hover:bg-[#374248] hover:text-[#00a884] transition-colors cursor-pointer"
        >
          <Zap className="w-4.5 h-4.5" />
        </button>

        {onLogout && (
          <button
            id="btn-logout"
            onClick={onLogout}
            title="Desconectar Instância / Sair"
            className="p-2 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        )}
      </div>
    </div>
  );
};

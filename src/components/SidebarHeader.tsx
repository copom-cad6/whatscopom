import React from 'react';
import { MessageSquarePlus, Zap, Radio, BellRing, Settings2, ShieldCheck } from 'lucide-react';
import { AppConfig } from '../types';

interface SidebarHeaderProps {
  config: AppConfig | null;
  socketConnected: boolean;
  onNewChat: () => void;
  onSimulate: () => void;
  onOpenIntegrations: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  config,
  socketConnected,
  onNewChat,
  onSimulate,
  onOpenIntegrations,
}) => {
  const isEvolutionConnected = config?.evolution.isConnected;
  const isN8nConfigured = Boolean(config?.n8n.webhookUrl && config?.n8n.enabled);

  return (
    <div id="sidebar-header" className="h-[64px] bg-[#202c33] px-4 flex items-center justify-between border-r border-[#222d34] select-none flex-shrink-0">
      {/* User profile & status pill */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[#374045] border border-[#222d34] flex items-center justify-center overflow-hidden">
            <img
              src="https://api.dicebear.com/7.x/bottts/svg?seed=ZapAdmin"
              alt="Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span
            title={socketConnected ? 'Socket.IO Conectado em Tempo Real' : 'Socket.IO Desconectado'}
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#202c33] ${
              socketConnected ? 'bg-[#00a884]' : 'bg-amber-500'
            }`}
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#e9edef]">ZapChat</span>
            <span className="text-xs text-[#00a884] font-medium">
              {isEvolutionConnected ? 'Evolution API Conectada' : 'Evolution Standby'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-[11px] text-[#8696a0]">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isEvolutionConnected ? 'bg-[#00a884]' : 'bg-neutral-500'}`} />
              API: {isEvolutionConnected ? 'Ativa' : 'Standby'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isN8nConfigured ? 'bg-indigo-400' : 'bg-neutral-500'}`} />
              n8n: {isN8nConfigured ? 'Ativo' : 'Pendente'}
            </span>
          </div>
        </div>
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-2 text-[#aebac1]">
        <button
          id="btn-simulate-msg"
          onClick={onSimulate}
          title="Simular Mensagem Recebida (Testar Webhooks e n8n)"
          className="p-2 rounded-full hover:bg-[#374248] hover:text-[#e9edef] transition-colors cursor-pointer relative"
        >
          <BellRing className="w-5 h-5 text-amber-400" />
        </button>

        <button
          id="btn-new-chat"
          onClick={onNewChat}
          title="Nova Conversa WhatsApp"
          className="p-2 rounded-full hover:bg-[#374248] hover:text-[#e9edef] transition-colors cursor-pointer"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>

        <button
          id="btn-open-integrations"
          onClick={onOpenIntegrations}
          title="Central de Integrações (Evolution API, n8n, Firebase & VPS)"
          className="p-2 rounded-full hover:bg-[#374248] hover:text-[#00a884] transition-colors cursor-pointer"
        >
          <Zap className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

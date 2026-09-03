import React from 'react';
import { MessageSquare, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface EmptyChatStateProps {
  onNewChat: () => void;
  onOpenIntegrations: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ onNewChat, onOpenIntegrations }) => {
  return (
    <div id="empty-chat-state" className="flex-1 flex flex-col items-center justify-center bg-[#0b141a] relative overflow-hidden p-8 text-center select-none border-b border-[#222d34]">
      {/* Elegant Dark Background Texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none elegant-dark-pattern" />

      <div className="max-w-md flex flex-col items-center space-y-5 z-10">
        <div className="w-20 h-20 rounded-full bg-[#111b21] flex items-center justify-center text-[#00a884] shadow-lg border border-[#222d34]">
          <MessageSquare className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-normal text-[#e9edef] tracking-wide">
            ZapChat Evolution & n8n
          </h2>
          <p className="text-sm text-[#8696a0] leading-relaxed">
            Envie e receba mensagens do WhatsApp em tempo real conectado à sua Evolution API, com disparo de webhooks para o n8n e pronto para sua VPS.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            id="btn-empty-new-chat"
            onClick={onNewChat}
            className="px-4 py-2.5 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Nova Conversa
          </button>
          <button
            id="btn-empty-integrations"
            onClick={onOpenIntegrations}
            className="px-4 py-2.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border border-[#222d34] text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#00a884]" />
            Configurar n8n & Evolution
          </button>
        </div>

        <div className="pt-8 border-t border-[#222d34] w-full flex items-center justify-center gap-2 text-xs text-[#8696a0]">
          <Lock className="w-3.5 h-3.5" />
          <span>Comunicação instantânea via Socket.io com proteção e controle total</span>
        </div>
      </div>
    </div>
  );
};

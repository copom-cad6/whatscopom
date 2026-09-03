import React, { useState } from 'react';
import { X, BellRing, Send, Sparkles, User, MessageSquare } from 'lucide-react';
import { Chat } from '../types';

interface SimulateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  activeChat: Chat | null;
  onSimulate: (chatId: string, text: string, senderName?: string) => Promise<void>;
}

const PRESET_MESSAGES = [
  'Olá! Gostaria de tirar uma dúvida sobre a contratação.',
  'Poderia me enviar a proposta em PDF atualizada?',
  'Qual o prazo estimado de entrega para São Paulo?',
  'Recebi o retorno de vocês, obrigado!',
  'Gostaria de falar com o suporte técnico com urgência.'
];

export const SimulateMessageModal: React.FC<SimulateMessageModalProps> = ({
  isOpen,
  onClose,
  chats,
  activeChat,
  onSimulate
}) => {
  const [selectedChatId, setSelectedChatId] = useState(activeChat?.id || chats[0]?.id || '');
  const [customText, setCustomText] = useState('');
  const [senderName, setSenderName] = useState(activeChat?.name || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setLoading(true);
    try {
      await onSimulate(selectedChatId, textToSend, senderName);
      setCustomText('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="simulate-message-modal-overlay" className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#111b21] border border-[#222d34] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-[#202c33] px-6 py-4 flex items-center justify-between border-b border-[#222d34]">
          <div className="flex items-center gap-2.5 text-[#e9edef]">
            <BellRing className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-semibold text-base">Simulador de Mensagem Recebida</h2>
              <p className="text-xs text-[#8696a0]">Dispara Socket.io em tempo real e Webhook para o n8n</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Target chat selector */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#00a884]" />
              Contato Remetente
            </label>
            <select
              value={selectedChatId}
              onChange={(e) => {
                setSelectedChatId(e.target.value);
                const found = chats.find((c) => c.id === e.target.value);
                if (found) setSenderName(found.name);
              }}
              className="w-full bg-[#202c33] border border-[#222d34] focus:border-[#00a884] rounded-lg px-3.5 py-2.5 text-sm text-[#e9edef] focus:outline-none"
            >
              {chats.map((chat) => (
                <option key={chat.id} value={chat.id} className="bg-[#202c33] text-[#e9edef]">
                  {chat.name} ({chat.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Mensagens de Teste Rápidas (clique para enviar):
            </label>
            <div className="space-y-1.5">
              {PRESET_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(preset)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] border border-[#222d34] text-xs text-[#e9edef] transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <span className="truncate mr-2">{preset}</span>
                  <Send className="w-3.5 h-3.5 text-[#8696a0] group-hover:text-[#00a884] flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message Input */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#00a884]" />
              Ou digite uma mensagem personalizada:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Ex: Mensagem customizada do cliente..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend(customText);
                  }
                }}
                className="flex-1 bg-[#202c33] border border-[#222d34] focus:border-[#00a884] rounded-lg px-3.5 py-2 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
              />
              <button
                onClick={() => handleSend(customText)}
                disabled={!customText.trim() || loading}
                className="px-4 py-2 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-[#111b21] font-semibold text-sm rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Disparar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

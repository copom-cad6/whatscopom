import React, { useState } from 'react';
import { X, MessageSquarePlus, Phone, User, Send } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (phone: string, name: string, initialMessage?: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onCreateChat }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setError('Informe um número de telefone válido com DDD (ex: 11999998888 ou 5511999998888)');
      return;
    }

    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    onCreateChat(formattedPhone, name.trim() || `+${formattedPhone}`, initialMessage.trim());
    onClose();
  };

  return (
    <div id="new-chat-modal-overlay" className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#111b21] border border-[#222d34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-[#202c33] px-6 py-4 flex items-center justify-between border-b border-[#222d34]">
          <div className="flex items-center gap-2.5 text-[#e9edef]">
            <MessageSquarePlus className="w-5 h-5 text-[#00a884]" />
            <h2 className="font-semibold text-base">Nova Conversa WhatsApp</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#00a884]" />
              Número de Telefone (WhatsApp) *
            </label>
            <input
              id="new-chat-phone"
              type="text"
              required
              placeholder="Ex: 11 99999-8888 ou 5511999998888"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-[#202c33] border border-[#222d34] focus:border-[#00a884] rounded-lg px-3.5 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
            />
            <p className="text-[11px] text-[#8696a0] mt-1">
              DDD + Número. O código do país +55 será adicionado se omitido.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#00a884]" />
              Nome do Contato (Opcional)
            </label>
            <input
              id="new-chat-name"
              type="text"
              placeholder="Ex: Ana Silva / Empresa XYZ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#202c33] border border-[#222d34] focus:border-[#00a884] rounded-lg px-3.5 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-[#00a884]" />
              Primeira Mensagem (Opcional)
            </label>
            <input
              id="new-chat-initial-message"
              type="text"
              placeholder="Ex: Olá, tudo bem? Entrando em contato sobre..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              className="w-full bg-[#202c33] border border-[#222d34] focus:border-[#00a884] rounded-lg px-3.5 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#202c33] border border-[#222d34] text-[#e9edef] text-sm hover:bg-[#2a3942] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-confirm-new-chat"
              className="px-4 py-2 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-semibold text-sm transition-colors cursor-pointer"
            >
              Iniciar Conversa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

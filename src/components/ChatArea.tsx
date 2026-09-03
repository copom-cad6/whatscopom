import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  Mic,
  MoreVertical,
  Search,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Headphones,
  Zap,
  Play,
  Pause,
  Trash2,
  Phone,
  Video
} from 'lucide-react';
import { Chat, Message } from '../types';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (text: string, media?: { mediaType: Message['mediaType']; mediaUrl: string; mediaName: string }) => void;
  onReactMessage: (messageId: string, reaction: string) => void;
  onSimulateIncoming: (text?: string) => void;
  onBack: () => void;
  isTyping: boolean;
  onSendTyping: (isTyping: boolean) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '✅', '🚀', '💯'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  onSendMessage,
  onReactMessage,
  onSimulateIncoming,
  onBack,
  isTyping,
  onSendTyping
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle typing state emit
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    onSendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onSendTyping(false);
    }, 1500);
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    onSendMessage(text);
    setInputText('');
    setShowEmojiPicker(false);
    onSendTyping(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendSimulatedAudio = () => {
    setIsRecording(false);
    setRecordSeconds(0);
    onSendMessage('Mensagem de áudio gravada (0:14)', {
      mediaType: 'audio',
      mediaUrl: 'https://example.com/audio.mp3',
      mediaName: 'Áudio_WhatsApp_014.ogg'
    });
  };

  const handleSendImageMock = () => {
    setShowAttachMenu(false);
    onSendMessage('Foto do comprovante / documento anexo', {
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
      mediaName: 'documento_fiscal.jpg'
    });
  };

  // Format message time
  const formatMsgTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div id="active-chat-area" className="flex-1 flex flex-col h-full bg-[#0b141a] relative overflow-hidden">
      {/* Elegant Dark Subtle Cubes Pattern Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none elegant-dark-pattern" />

      {/* Top Header matching Elegant Dark specification */}
      <div id="chat-header" className="h-[64px] bg-[#202c33] px-4 flex items-center justify-between border-b border-[#222d34] z-10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden p-1 rounded-full text-[#aebac1] hover:bg-[#374248] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-shrink-0 cursor-pointer">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#4f5e67] flex items-center justify-center text-white font-medium">
              {chat.avatar ? (
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-sm">{chat.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            {chat.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00a884] border-2 border-[#202c33]" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-[#e9edef] truncate">{chat.name}</span>
            <span className="text-[11px] text-[#8696a0] truncate">
              {chat.isTyping ? (
                <span className="text-[#00a884] font-medium animate-pulse">digitando...</span>
              ) : chat.isOnline ? (
                <span className="text-[#8696a0]">online</span>
              ) : (
                chat.phone
              )}
            </span>
          </div>
        </div>

        {/* Header Right Action Icons */}
        <div className="flex items-center gap-3 text-[#aebac1]">
          <button
            onClick={() => onSimulateIncoming()}
            title="Simular mensagem recebida deste cliente (Testa Webhook Evolution & n8n)"
            className="px-2.5 py-1 rounded bg-[#00a884]/15 hover:bg-[#00a884]/25 text-[#00a884] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-[#00a884]/30"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simular Mensagem</span>
          </button>

          <button
            title="Pesquisar mensagens"
            className="p-2 rounded-full hover:bg-[#374248] hover:text-[#e9edef] transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            title="Mais opções"
            className="p-2 rounded-full hover:bg-[#374248] hover:text-[#e9edef] transition-colors cursor-pointer"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message Thread Area */}
      <div id="messages-container" className="flex-1 overflow-y-auto p-6 flex flex-col gap-2 z-10 relative">
        {/* End-to-end security notice */}
        <div className="self-center bg-[#182229] border border-[#222d34] text-[#ffd279] text-[11px] px-3 py-1.5 rounded-lg shadow-sm max-w-md text-center flex items-center gap-2 mb-2">
          <span>🔒</span>
          <span className="text-[#ffd279]/90">
            As mensagens são protegidas de ponta a ponta. Integração via Evolution API e n8n ativa.
          </span>
        </div>

        {/* Date divider matching Elegant Dark */}
        <div className="self-center bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-md mb-4 uppercase tracking-wider font-medium shadow-sm">
          Hoje
        </div>

        {/* Messages */}
        {messages.map((msg) => {
          const isMe = msg.fromMe;
          const isHovered = hoveredMessageId === msg.id;

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
              className={`flex items-end gap-1 ${isMe ? 'self-end' : 'self-start'} group relative`}
            >
              {/* Quick Reactions Bar on Hover */}
              {isHovered && (
                <div
                  className={`absolute -top-7 ${
                    isMe ? 'right-2' : 'left-2'
                  } bg-[#202c33] border border-[#374248] rounded-full px-2 py-0.5 flex items-center gap-1 shadow-lg z-20 animate-fade-in`}
                >
                  {COMMON_EMOJIS.slice(0, 6).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReactMessage(msg.id, emoji)}
                      className="hover:scale-125 transition-transform text-sm p-0.5 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Bubble matching Elegant Dark */}
              <div
                className={`p-2 rounded-lg max-w-[450px] shadow-sm relative select-text ${
                  isMe
                    ? 'self-end bg-[#005c4b] rounded-tr-none text-[#e9edef]'
                    : 'self-start bg-[#202c33] rounded-tl-none text-[#e9edef]'
                }`}
              >
                {/* Image Media Preview */}
                {msg.mediaType === 'image' && msg.mediaUrl && (
                  <div className="mb-1.5 rounded overflow-hidden max-h-60 bg-black/20">
                    <img
                      src={msg.mediaUrl}
                      alt="Anexo"
                      className="w-full h-auto object-cover max-h-60"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Audio Note Simulation */}
                {msg.mediaType === 'audio' && (
                  <div className="flex items-center gap-3 py-1 min-w-[200px]">
                    <button
                      onClick={() =>
                        setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)
                      }
                      className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors bg-[#00a884] text-[#111b21]"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-[#00a884] transition-all duration-300 ${
                            playingAudioId === msg.id ? 'w-3/4' : 'w-1/4'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-[#8696a0] mt-1 block">
                        {playingAudioId === msg.id ? '0:10 / 0:14' : '0:14'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Message Text Content */}
                {msg.text && (
                  <p className="text-sm pr-12 leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}

                {/* Meta info: Time and Status Checks */}
                {isMe ? (
                  <div className="absolute bottom-1 right-2 flex items-center gap-0.5">
                    <span className="text-[10px] text-[#8696a0]">{formatMsgTime(msg.timestamp)}</span>
                    {msg.status === 'read' ? (
                      <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                    ) : msg.status === 'delivered' ? (
                      <CheckCheck className="w-4 h-4 text-[#8696a0]" />
                    ) : msg.status === 'sent' ? (
                      <Check className="w-4 h-4 text-[#8696a0]" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-[#8696a0]" />
                    )}
                  </div>
                ) : (
                  <span className="absolute bottom-1 right-2 text-[10px] text-[#8696a0]">
                    {formatMsgTime(msg.timestamp)}
                  </span>
                )}

                {/* Reaction Pill */}
                {msg.reaction && (
                  <div
                    className={`absolute -bottom-2.5 ${
                      isMe ? 'right-2' : 'left-2'
                    } bg-[#1f2c34] border border-[#2a3942] rounded-full px-1.5 py-0.2 text-xs flex items-center shadow`}
                  >
                    <span>{msg.reaction}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Contact is typing animated indicator */}
        {chat.isTyping && (
          <div className="flex items-center gap-2 text-xs text-[#8696a0] italic bg-[#202c33]/70 px-3 py-1.5 rounded-lg w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.4s]" />
            <span className="ml-1 text-[#00a884] font-medium">{chat.name} está digitando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="bg-[#202c33] border-t border-[#222d34] px-4 py-3 flex flex-wrap gap-2 z-20 max-h-36 overflow-y-auto">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-xl hover:scale-125 transition-transform p-1 cursor-pointer rounded hover:bg-[#2a3942]"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Popover Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-12 bg-[#202c33] border border-[#374248] rounded-xl shadow-2xl p-2 z-30 flex flex-col gap-1 w-48 animate-fade-in">
          <button
            onClick={handleSendImageMock}
            className="flex items-center gap-3 px-3 py-2 text-sm text-[#e9edef] hover:bg-[#2a3942] rounded-lg cursor-pointer transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span>Fotos & Vídeos</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              onSendMessage('Contrato_Prestacao_Servicos.pdf', {
                mediaType: 'document',
                mediaUrl: 'https://example.com/contrato.pdf',
                mediaName: 'Contrato.pdf'
              });
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm text-[#e9edef] hover:bg-[#2a3942] rounded-lg cursor-pointer transition-colors"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Documento</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              onSendMessage('Áudio gravado_01.mp3', {
                mediaType: 'audio',
                mediaUrl: 'https://example.com/audio.mp3',
                mediaName: 'Audio.mp3'
              });
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm text-[#e9edef] hover:bg-[#2a3942] rounded-lg cursor-pointer transition-colors"
          >
            <Headphones className="w-4 h-4 text-amber-400" />
            <span>Áudio / Música</span>
          </button>
        </div>
      )}

      {/* Bottom Input Controls matching Elegant Dark */}
      <div id="chat-input-bar" className="h-[62px] bg-[#202c33] px-4 flex items-center gap-4 border-t border-[#222d34] z-10 flex-shrink-0">
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-[#111b21] rounded-lg px-4 py-2 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[#e9edef] font-mono">0:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}</span>
              <span className="text-[#8696a0] text-xs">Gravando mensagem de voz...</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsRecording(false);
                  setRecordSeconds(0);
                }}
                className="p-1.5 text-[#8696a0] hover:text-red-400 cursor-pointer"
                title="Cancelar gravação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleSendSimulatedAudio}
                className="px-3 py-1 bg-[#00a884] text-[#111b21] font-semibold text-xs rounded-md cursor-pointer hover:bg-[#02906f]"
              >
                Enviar Áudio
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 text-[#8696a0]">
              <button
                id="btn-toggle-emoji"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`p-1 hover:text-[#e9edef] transition-colors cursor-pointer ${
                  showEmojiPicker ? 'text-[#00a884]' : ''
                }`}
                title="Emojis"
              >
                <Smile className="w-6 h-6" />
              </button>

              <button
                id="btn-toggle-attach"
                onClick={() => setShowAttachMenu((prev) => !prev)}
                className={`p-1 hover:text-[#e9edef] transition-colors cursor-pointer ${
                  showAttachMenu ? 'text-[#00a884]' : ''
                }`}
                title="Anexar arquivo"
              >
                <Paperclip className="w-6 h-6" />
              </button>
            </div>

            {/* Main Text Input */}
            <input
              ref={inputRef}
              id="message-text-input"
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem"
              className="flex-1 bg-[#2a3942] border-none rounded-lg text-sm px-4 py-2.5 focus:outline-none focus:ring-0 text-[#d1d7db] placeholder-[#8696a0]"
            />

            {/* Send or Mic Button */}
            {inputText.trim().length > 0 ? (
              <button
                id="btn-send-message"
                onClick={handleSend}
                className="p-2.5 rounded-full bg-[#00a884] text-[#111b21] hover:bg-[#02906f] transition-all cursor-pointer shadow-md flex-shrink-0"
                title="Enviar mensagem (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-[#8696a0]">
                <button
                  id="btn-voice-record"
                  onClick={() => {
                    setIsRecording(true);
                    setRecordSeconds(0);
                  }}
                  className="p-1 hover:text-[#e9edef] transition-colors cursor-pointer flex-shrink-0"
                  title="Gravar mensagem de voz"
                >
                  <Mic className="w-6 h-6" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  Search,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic,
  Send,
  Check,
  CheckCheck,
} from "lucide-react";
import type { Contact, Message } from "./ChatInterface";
import { BASE_API_URL } from "../config/Config";

interface ChatWindowProps {
  contact: Contact | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onProfileClick?: () => void;
  onFileSelect?: (file: File) => void;
}

export function ChatWindow({
  contact,
  messages,
  onSendMessage,
  onVoiceCall,
  onVideoCall,
  onProfileClick,
  onFileSelect,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File size exceeds 50MB limit');
        return;
      }
      if (onFileSelect) {
        onFileSelect(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!contact) {
    return (
      <div className="flex-1 bg-[#0b141a] flex items-center justify-center">
        <div className="text-center text-[#667781]">
          <MessageSquare
            size={80}
            className="mx-auto mb-4 opacity-20"
          />
          <p className="text-lg">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] relative">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="bg-[#202c33] p-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {contact.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00d95f] rounded-full border-2 border-[#202c33]" />
            )}
          </div>
          <div>
            <h2 className="text-white">{contact.name}</h2>
            <p className="text-xs text-[#667781]">
              {contact.online ? "online" : "offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onVoiceCall && onVoiceCall()}
            className="text-[#aebac1] hover:text-white transition-colors"
            title="Voice call"
          >
            <Phone size={20} />
          </button>
          <button 
            onClick={() => onVideoCall && onVideoCall()}
            className="text-[#aebac1] hover:text-white transition-colors"
            title="Video call"
          >
            <Video size={20} />
          </button>
          <button 
            onClick={() => onProfileClick && onProfileClick()}
            className="text-[#aebac1] hover:text-white transition-colors"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 relative z-10">
        {messages.map((message) => {
          // Render call history messages differently
          if (message.isCallHistory) {
            return (
              <div
                key={message.id}
                className="flex justify-center mb-2"
              >
                <div className="bg-[#202c33] rounded-md px-3 py-2 flex items-center gap-2 text-[#8696a0]">
                  {message.callType === 'video' ? (
                    <Video size={16} className={message.sent ? "text-[#00a884]" : "text-[#f15c6d]"} />
                  ) : (
                    <Phone size={16} className={message.sent ? "text-[#00a884]" : "text-[#f15c6d]"} />
                  )}
                  <span className="text-[13px]">{message.text}</span>
                  <span className="text-[11px] text-[#667781]">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            );
          }
          
          // Regular message
          return (
            <div
              key={message.id}
              className={`flex ${message.sent ? "justify-end" : "justify-start"} mb-1`}
            >
              <div
                className={`relative max-w-[75%] rounded-md px-3 py-2 shadow-sm ${
                  message.sent
                    ? "bg-[#005c4b] text-white rounded-br-none"
                    : "bg-[#202c33] text-white rounded-bl-none"
                }`}
                style={{
                  borderRadius: message.sent 
                    ? "7.5px 7.5px 0px 7.5px"
                    : "7.5px 7.5px 7.5px 0px"
                }}
              >
                {/* File attachment */}
                {message.fileName && message.filePath && (
                  <div className="mb-2 bg-[#182229] rounded-md p-2">
                    {message.fileType?.startsWith('image/') ? (
                      <div>
                        <img 
                          src={`${BASE_API_URL}/uploads/${message.filePath}`}
                          alt={message.fileName}
                          className="max-w-[300px] max-h-[300px] rounded-md mb-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <a
                          href={`${BASE_API_URL}/api/messages/download/${message.id}`}
                          download={message.fileName}
                          className="text-[13px] text-[#00a884] hover:underline flex items-center gap-1"
                        >
                          <Paperclip size={14} />
                          {message.fileName} ({formatFileSize(message.fileSize)})
                        </a>
                      </div>
                    ) : (
                      <a
                        href={`${BASE_API_URL}/api/messages/download/${message.id}`}
                        download={message.fileName}
                        className="text-[13px] text-[#00a884] hover:underline flex items-center gap-1"
                      >
                        <Paperclip size={14} />
                        {message.fileName} ({formatFileSize(message.fileSize)})
                      </a>
                    )}
                  </div>
                )}
                
                {message.text && (
                  <p className="text-[14px] leading-[19px] break-words mb-1">
                    {message.text}
                  </p>
                )}
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[11px] text-[#8696a0] leading-[15px]">
                    {message.timestamp}
                  </span>
                  {message.sent && (
                    <span className="text-[#8696a0]">
                      {message.status === "read" ? (
                        <CheckCheck
                          size={16}
                          className="text-[#53bdeb]"
                        />
                      ) : message.status === "delivered" ? (
                        <CheckCheck size={16} />
                      ) : (
                        <Check size={16} />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#202c33] p-4 relative z-10">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="text-[#aebac1] hover:text-white transition-colors"
          >
            <Smile size={24} />
          </button>
          <button
            type="button"
            onClick={handleAttachClick}
            className="text-[#aebac1] hover:text-white transition-colors"
          >
            <Paperclip size={24} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message"
            className="flex-1 bg-[#2a3942] text-white placeholder:text-[#667781] rounded-lg px-4 py-2 outline-none"
          />
          {inputText.trim() ? (
            <button
              type="submit"
              className="text-[#aebac1] hover:text-white transition-colors"
            >
              <Send size={24} />
            </button>
          ) : (
            <button
              type="button"
              className="text-[#aebac1] hover:text-white transition-colors"
            >
              <Mic size={24} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function MessageSquare({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
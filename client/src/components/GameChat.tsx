import { Bot, Send } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ChatMessage } from '../types';

export function GameChat({
  messages,
  currentUserId,
  onSend,
  title = 'Table Chat',
  placeholder = 'Write a message...',
  emptyText = 'Say hello to your opponent.',
  quickPrompts,
  isAiCoach = false,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string) => void;
  title?: string;
  placeholder?: string;
  emptyText?: string;
  quickPrompts?: string[];
  isAiCoach?: boolean;
}) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="flex h-72 flex-col rounded border border-[#2A313F] bg-[#151921]">
      <div className="flex items-center justify-between border-b border-[#2A313F] bg-[#1B202A] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
        <span className="inline-flex items-center gap-1.5">
          {isAiCoach && <Bot className="h-3.5 w-3.5 text-[#D4AF37]" />}
          {title}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#6B7280]">{emptyText}</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="mb-0.5 text-[11px] text-[#9CA3AF]">
                  {isMe ? 'You' : msg.senderUsername}
                </span>
                <div
                  className={`max-w-[85%] rounded px-2.5 py-1.5 text-xs ${
                    isMe
                      ? 'border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F5F0E6]'
                      : 'border border-[#2A313F] bg-[#1B202A] text-[#F5F0E6]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      {quickPrompts && quickPrompts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-[#2A313F]/70 bg-[#11141B] px-2.5 py-1.5">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSend(prompt)}
              className="rounded border border-[#2A313F] bg-[#1B202A] px-2 py-0.5 text-[11px] text-[#D1D5DB] transition hover:border-[#D4AF37]/50 hover:text-[#F5E199]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-[#2A313F] p-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          maxLength={500}
          className="flex-1 rounded border border-[#2A313F] bg-[#0D0F12] px-3 py-1.5 text-xs text-[#F5F0E6] placeholder:text-[#6B7280] focus:border-[#D4AF37] focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#B59124] bg-[#D4AF37] text-[#0D0F12] transition hover:bg-[#E5C158]"
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

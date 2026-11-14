import { Send } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ChatMessage } from '../types';

export function GameChat({
  messages,
  currentUserId,
  onSend,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string) => void;
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
    <div className="flex h-60 flex-col rounded border border-[#2A313F] bg-[#151921]">
      <div className="border-b border-[#2A313F] bg-[#1B202A] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
        Table Chat
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#6B7280]">
            Say hello to your opponent.
          </p>
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
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-[#2A313F] p-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
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

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
    <div className="flex h-60 flex-col rounded border border-[#DDD6C8] bg-white">
      <div className="border-b border-[#DDD6C8] bg-[#F6F3EC] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#57534E]">
        Table Chat
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#78716C]">
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
                <span className="mb-0.5 text-[11px] text-[#78716C]">
                  {isMe ? 'You' : msg.senderUsername}
                </span>
                <div
                  className={`max-w-[85%] rounded px-2.5 py-1.5 text-xs ${
                    isMe
                      ? 'border border-[#1B5E3A]/30 bg-[#1B5E3A]/10 text-[#1C1917]'
                      : 'border border-[#DDD6C8] bg-[#F6F3EC] text-[#1C1917]'
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
        className="flex items-center gap-2 border-t border-[#DDD6C8] p-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          maxLength={500}
          className="flex-1 rounded border border-[#D6CEC0] bg-[#FAF8F4] px-3 py-1.5 text-xs text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B5E3A] focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#14472B] bg-[#1B5E3A] text-white transition hover:bg-[#14472B]"
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

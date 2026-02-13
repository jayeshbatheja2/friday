import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface ChatHistoryProps {
  messages: Message[];
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl max-h-48 overflow-y-auto px-4 scrollbar-hide mask-image-gradient">
      <div className="flex flex-col gap-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg text-sm md:text-base backdrop-blur-md border ${
                msg.sender === 'user'
                  ? 'bg-cyan-900/30 border-cyan-700/50 text-cyan-100 rounded-tr-none'
                  : 'bg-black/40 border-cyan-500/30 text-cyan-300 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

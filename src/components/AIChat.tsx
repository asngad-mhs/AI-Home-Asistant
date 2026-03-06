import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Card } from './ui/Card';
import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AIChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isTyping: boolean;
}

export function AIChat({ messages, onSendMessage, isTyping }: AIChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const msg = input;
    setInput('');
    await onSendMessage(msg);
  };

  return (
    <Card className="h-[600px] flex flex-col p-0 border-cyber-primary/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border bg-cyber-card/80 backdrop-blur flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cyber-primary/10 flex items-center justify-center border border-cyber-primary/50 relative">
          <Bot className="w-6 h-6 text-cyber-primary" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-success rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,157,0.8)]" />
        </div>
        <div>
          <h3 className="font-bold text-white tracking-wide">AI ASSISTANT</h3>
          <p className="text-[10px] text-cyber-primary font-mono uppercase tracking-widest">System Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                msg.role === 'user' 
                  ? "bg-cyber-secondary/20 border-cyber-secondary/50 text-cyber-secondary" 
                  : "bg-cyber-primary/20 border-cyber-primary/50 text-cyber-primary"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={cn(
                "p-3 rounded-lg text-sm leading-relaxed border",
                msg.role === 'user'
                  ? "bg-cyber-secondary/10 border-cyber-secondary/30 text-gray-200 rounded-tr-none"
                  : "bg-cyber-primary/10 border-cyber-primary/30 text-gray-200 rounded-tl-none"
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex gap-3 max-w-[85%]"
          >
            <div className="w-8 h-8 rounded-full bg-cyber-primary/20 border border-cyber-primary/50 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-cyber-primary animate-spin-slow" />
            </div>
            <div className="bg-cyber-primary/5 border border-cyber-primary/20 p-3 rounded-lg rounded-tl-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-cyber-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-cyber-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-cyber-primary rounded-full animate-bounce" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-cyber-border bg-cyber-card/50 backdrop-blur">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command or ask..."
            className="w-full bg-black/50 border border-cyber-border rounded-lg py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 transition-all placeholder:text-gray-600 font-mono"
            disabled={isTyping}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 rounded-md bg-cyber-primary/20 text-cyber-primary hover:bg-cyber-primary hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </Card>
  );
}

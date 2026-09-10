import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, X, Sparkles, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sendChatMessage, ChatMessage, GroqConfigError, GroqRequestError } from '../../utils/groqClient';
import { buildSystemPrompt } from '../../utils/assistantContext';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
}

const SUGGESTIONS = [
  'Which requests are highest priority right now?',
  'Explain how the AI pipeline schedules a block',
  'Are there any corridor conflicts today?',
  'What does a priority score of 85 mean?',
];

const WELCOME: DisplayMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi, I'm the RailBlock AI Assistant. Ask me about maintenance requests, priority scores, corridor conflicts, or how the block-scheduling pipeline works.",
};

export const AIAssistantWidget: React.FC = () => {
  const { role, requests, ganttBlocks, corridors, trainSchedules, stats } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  const resetChat = () => setMessages([WELCOME]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: DisplayMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt({
        role,
        requests,
        ganttBlocks,
        corridors,
        trainSchedules,
        stats,
      });

      const history: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-8)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: text },
      ];

      const reply = await sendChatMessage(history);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply }]);
    } catch (err) {
      let msg = 'Something went wrong talking to the AI Assistant.';
      if (err instanceof GroqConfigError) {
        msg = err.message;
      } else if (err instanceof GroqRequestError) {
        msg =
          err.status === 401
            ? 'Groq rejected the API key (401). Double-check VITE_GROQ_API_KEY in your .env file.'
            : err.status === 429
            ? 'Rate limited by Groq (free tier). Wait a few seconds and try again.'
            : err.message;
      }
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: 'error', content: msg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-railway-orange text-white shadow-glow-orange flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          aria-label="Open AI Assistant"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[600px] flex flex-col rounded-2xl glass-panel border border-railway-border shadow-glass overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-railway-border bg-railway-surface/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-railway-orange/15 border border-railway-orange/40 flex items-center justify-center text-railway-orange">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">AI Assistant</p>
                <p className="text-[10px] text-slate-400 leading-tight">Block Planning Insights</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                title="Reset conversation"
                className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'error' ? (
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-[11.5px] leading-relaxed bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{m.content}</span>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-[11.5px] leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-railway-orange text-white rounded-br-sm'
                        : 'bg-railway-surface border border-railway-border text-slate-200 rounded-bl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-xl px-3 py-2 bg-railway-surface border border-railway-border text-slate-400 text-[11.5px] flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}

            {messages.length === 1 && !isLoading && (
              <div className="flex flex-col gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-left text-[11px] px-3 py-2 rounded-lg bg-railway-surface border border-railway-border text-slate-300 hover:border-railway-orange/50 hover:text-white transition cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-railway-border p-2.5 bg-railway-surface/60">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about priorities, conflicts, schedules..."
                rows={1}
                className="flex-1 resize-none bg-railway-bg border border-railway-border rounded-xl px-3 py-2 text-[11.5px] text-white placeholder:text-slate-500 focus:outline-none focus:border-railway-orange/60 max-h-24"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 shrink-0 rounded-xl bg-railway-orange text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

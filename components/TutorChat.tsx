'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TutorChatProps {
  initialSection?: string;
}

export default function TutorChat({ initialSection }: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Bonjour ! Je suis Roxy, ton tuteur de maths. 😊 Je suis là pour t'aider avec les taux, les rapports, les proportions et les pourcentages. ${
        initialSection ? `Je vois que tu travailles sur la section **${initialSection}**. ` : ''
      }Pose-moi n'importe quelle question sur ces sujets et on va trouver ça ensemble !`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState(initialSection ?? '');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          sectionSlug: selectedSection || undefined,
        }),
      });

      if (!res.ok) throw new Error('Erreur de connexion');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMsg: Message = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistantMsg]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: assistantContent },
          ]);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Oups ! Je n'arrive pas à me connecter en ce moment. Vérifie ta connexion internet et réessaie. 😕",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sections: { slug: string; label: string; disabled?: boolean }[] = [
    { slug: '', label: 'Toutes les sections' },
    { slug: 'rappel-tr', label: 'Rappel — Fractions, décimaux, %' },
    { slug: 'rapports', label: 'Rapports' },
    { slug: 'taux', label: 'Taux' },
    { slug: 'proportions', label: 'Proportions' },
    { slug: 'pourcentages-tr', label: 'Pourcentages' },
    { slug: 'rabais-taxes', label: 'Rabais et taxes' },
    { slug: 'synthese-tr', label: 'Synthèse' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Section selector */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:border-violet-400"
        >
          {sections.map((s, i) =>
            s.disabled ? (
              <option key={i} disabled value="">
                {s.label}
              </option>
            ) : (
              <option key={s.slug + i} value={s.slug}>
                {s.label}
              </option>
            )
          )}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold mr-2 shrink-0 mt-1">
                R
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.content || (loading && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose ta question à Roxy…"
            rows={2}
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:border-violet-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold px-4 rounded-xl transition-colors"
          >
            {loading ? '⏳' : '→'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Appuie sur Entrée pour envoyer • Shift+Entrée pour nouvelle ligne
        </p>
      </div>
    </div>
  );
}

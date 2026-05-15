"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMe, getHistory, clearToken, isAuthenticated, UserMe, HistoryItem } from "@/lib/api";

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
      return;
    }

    const loadData = async () => {
      try {
        const u = await getMe();
        setUser(u);
        const h = await getHistory();
        setHistory(h);
      } catch (err) {
        console.error(err);
        clearToken();
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.replace("/");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-brand-400 rounded-full loading-dot" />
          <div className="w-2 h-2 bg-brand-400 rounded-full loading-dot" />
          <div className="w-2 h-2 bg-brand-400 rounded-full loading-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/assistant" className="flex items-center gap-4 group">
              <img 
                src="/logo-icon.png" 
                alt="OBIA" 
                className="w-12 h-12 object-contain group-hover:scale-105 transition-transform" 
              />
              <div className="flex flex-col">
                <span className="font-bold text-white text-lg tracking-tight leading-none">Mi Historial</span>
                <span className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mt-1">Bolivia 2026</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/assistant" className="text-sm text-brand-400 hover:text-brand-300 font-medium">
              Volver al Chat
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <button onClick={handleLogout} className="btn-ghost text-sm p-2" title="Cerrar sesión">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Interacciones previas</h1>
          <p className="text-gray-400 text-sm">
            Todas tus consultas y respuestas de esta competencia.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 italic">No se encontraron consultas previas.</p>
            <Link href="/assistant" className="btn-primary inline-flex mt-6">
              Comenzar a chatear
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Consultas previas</h3>
            {history.map((item) => (
              <div
                key={item.id}
                className={`card overflow-hidden transition-all duration-300 ${
                  expandedId === item.id ? "ring-1 ring-brand-500/30" : "hover:bg-white/[0.02]"
                }`}
              >
                {/* Summary Header */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className={`text-sm font-medium transition-colors ${expandedId === item.id ? "text-brand-400" : "text-gray-200"} truncate`}>
                      {item.prompt}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                      expandedId === item.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>

                {/* Expanded Detail */}
                {expandedId === item.id && (
                  <div className="px-5 pb-6 border-t border-white/[0.04] pt-6 space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tu pregunta</h4>
                      <div className="bg-gray-900/50 rounded-xl p-4 text-sm text-gray-200 leading-relaxed border border-white/[0.03]">
                        {item.prompt}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">Respuesta de la IA</h4>
                      <div className="prose-ai max-w-none bg-brand-500/[0.02] rounded-xl p-6 border border-brand-500/10">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {item.response}
                        </ReactMarkdown>
                      </div>
                    </div>

                    <div className="flex gap-4 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                      <span>Tokens: {item.input_tokens + item.output_tokens} (Entrada: {item.input_tokens} / Salida: {item.output_tokens})</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

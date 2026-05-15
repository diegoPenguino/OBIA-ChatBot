"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMe, askQuestion, clearToken, isAuthenticated, UserMe, AskResponse, getHistory, HistoryItem } from "@/lib/api";

export default function AssistantPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<UserMe | null>(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenEstimate, setTokenEstimate] = useState(0);

  // Auth check and initial data fetch
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
      return;
    }
    
    // Fetch profile
    getMe()
      .then(setUser)
      .catch(() => {
        clearToken();
        router.replace("/");
      });

    // Fetch history
    getHistory()
      .then(setHistory)
      .catch(console.error);
  }, [router]);

  // Rough token estimate (1 token ≈ 4 chars for English)
  useEffect(() => {
    const estimate = Math.ceil(prompt.length / 4);
    setTokenEstimate(estimate);
  }, [prompt]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 300) + "px";
    }
  }, [prompt]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setError("");
    setResponse(null);
    setLoading(true);

    try {
      const result = await askQuestion(prompt.trim());
      setResponse(result);
      
      // Update usage stats
      setUser((prev) =>
        prev
          ? {
              ...prev,
              requests_used: prev.max_requests - result.requests_remaining,
            }
          : prev
      );

      // Refresh history to include the new interaction
      const updatedHistory = await getHistory();
      setHistory(updatedHistory);
      
      setPrompt("");
      // Scroll to response
      setTimeout(() => {
        responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.replace("/");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  if (!user) {
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

  const requestsRemaining = user.max_requests - user.requests_used;
  const usagePercent = (user.requests_used / user.max_requests) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/logo-icon.png" 
              alt="OBIA" 
              className="w-12 h-12 object-contain" 
            />
            <div className="flex flex-col">
              <span className="font-bold text-white text-lg tracking-tight leading-none">OBIA</span>
              <span className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mt-1">Bolivia 2026</span>
            </div>
          </div>          <div className="flex items-center gap-4">
            <Link href="/history" className="text-sm text-brand-400 hover:text-brand-300 font-medium">
              Historial
            </Link>
            
            <div className="h-6 w-px bg-white/10" />

            {/* Usage indicator */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-400">Restantes</div>
                <div className={`text-sm font-semibold ${requestsRemaining <= 10 ? "text-red-400" : requestsRemaining <= 30 ? "text-yellow-400" : "text-emerald-400"}`}>
                  {requestsRemaining}/{user.max_requests}
                </div>
              </div>
              <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-yellow-500" : "bg-emerald-500"}`}
                  style={{ width: `${100 - usagePercent}%` }}
                />
              </div>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-600/30 flex items-center justify-center text-xs font-medium text-brand-300">
                {(user.first_name || user.username).slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-gray-300 hidden sm:inline">{user.first_name || user.username}</span>
            </div>

            <button onClick={handleLogout} className="btn-ghost text-sm" title="Cerrar sesión">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 pb-32">
        {/* Mobile usage bar */}
        <div className="sm:hidden mb-6">
          <div className="card p-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Consultas restantes</span>
            <span className={`font-semibold ${requestsRemaining <= 10 ? "text-red-400" : "text-emerald-400"}`}>
              {requestsRemaining}/{user.max_requests}
            </span>
          </div>
        </div>

        {/* Response Area (Current Answer) */}
        {(response || loading || error) && (
          <div ref={responseRef} className="mb-12">
            <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-4 ml-1">Respuesta actual</h3>
            {loading && (
              <div className="card p-8">
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-brand-400 rounded-full loading-dot" />
                    <div className="w-2 h-2 bg-brand-400 rounded-full loading-dot" />
                    <div className="w-2 h-2 bg-brand-400 rounded-full loading-dot" />
                  </div>
                  <span className="text-sm">Pensando…</span>
                </div>
              </div>
            )}

            {error && (
              <div className="card p-6 border-red-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-400 font-medium text-sm">Error</p>
                    <p className="text-red-300/80 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {response && (
              <div className="card p-6 sm:p-8 border-brand-500/20 bg-brand-500/[0.02]">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.06]">
                  <div className="w-6 h-6 rounded-md bg-brand-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-300">Última respuesta</span>
                  <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
                    <span>Entrada: {response.input_tokens} tokens</span>
                    <span>Salida: {response.output_tokens} tokens</span>
                  </div>
                </div>

                <div className="prose-ai">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {response.response}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Welcome state */}
        {!response && !loading && !error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/10 mb-6">
              <svg className="w-10 h-10 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455-2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455-2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Haz cualquier consulta sobre IA y ML
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Puedo explicar conceptos de IA, machine learning, Python, matemáticas y estadística.
            </p>
          </div>
        )}

        {/* Input Form */}
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="card p-4 shadow-2xl shadow-brand-500/5">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Haz una pregunta sobre IA, ML, Python, matemáticas…"
                className="w-full bg-transparent border-0 text-gray-100 placeholder-gray-500 resize-none focus:outline-none text-sm sm:text-base"
                rows={2}
                disabled={loading || requestsRemaining <= 0}
              />

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  ~{tokenEstimate} tokens
                  {tokenEstimate > 1500 && (
                    <span className="text-yellow-400 ml-1">(cerca del límite)</span>
                  )}
                </span>
                <span className="sm:hidden">
                  {requestsRemaining} restantes
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !prompt.trim() || requestsRemaining <= 0}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {loading ? (
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full loading-dot" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full loading-dot" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full loading-dot" />
                  </div>
                ) : (
                  <>
                    <span>Preguntar</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {requestsRemaining <= 0 && (
            <div className="text-center mt-3">
              <span className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full">
                Has agotado todas tus consultas
              </span>
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, isAuthenticated, getMe } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      getMe()
        .then((user) => {
          router.replace(user.is_admin ? "/admin" : "/assistant");
        })
        .catch(() => {
          setChecking(false);
        });
    } else {
      setChecking(false);
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      const user = await getMe();
      router.push(user.is_admin ? "/admin" : "/assistant");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/full-logo.png" 
              alt="OBIA Logo" 
              className="h-24 w-auto drop-shadow-2xl" 
            />
          </div>
          <p className="text-gray-400 mt-1 text-sm font-medium tracking-wide">
            IOAI Bolivia 2026 — Asistente de IA
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full loading-dot" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full loading-dot" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full loading-dot" />
                  </div>
                  <span>Iniciando sesión…</span>
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Competencia de Selección IOAI Bolivia 2026
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/api";
import Image from "next/image";
import { BUSINESS } from "@/lib/services";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(username, password);
      router.push("/admin/dashboard");
    } catch (err) {
      setError((err as Error).message ?? "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/logo.webp" alt={BUSINESS.name} width={56} height={56} className="rounded object-contain" />
          <h1 className="text-lg font-bold text-white">{BUSINESS.name}</h1>
          <p className="text-sm text-zinc-400">Admin dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Admin ID"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Admin Password"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-10 text-sm text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="h-4 w-4"
                  >
                    {showPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.3 4.5 9 7-.3 1.1-1.1 2.4-2.3 3.5" />
                        <path d="M6.2 6.2C4.4 7.4 3.3 9.2 3 12c.7 2.5 4 7 9 7 1.1 0 2.1-.2 3-.6" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-md bg-brand-500 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-brand-400 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

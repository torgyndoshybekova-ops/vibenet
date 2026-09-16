"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="surface border border-vn rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold text-coral text-center mb-2">VibeNet</h1>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="surface-2 border border-vn rounded-lg px-3 py-2.5 text-sm outline-none"
        />
        <input
          type="password"
          placeholder="Пароль"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="surface-2 border border-vn rounded-lg px-3 py-2.5 text-sm outline-none"
        />
        {error && <p className="text-coraldark text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-coral text-white rounded-lg py-2.5 text-sm font-bold disabled:opacity-50"
        >
          {loading ? "Входим..." : "Войти"}
        </button>
        <p className="text-dim text-sm text-center">
          Нет аккаунта?{" "}
          <Link href="/signup" className="text-coral font-semibold">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </div>
  );
}

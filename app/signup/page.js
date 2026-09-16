"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, name: username },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="surface border border-vn rounded-2xl p-8 max-w-sm">
          <h1 className="text-xl font-bold mb-2">Проверьте почту 📩</h1>
          <p className="text-dim text-sm">
            Мы отправили письмо для подтверждения регистрации. Перейдите по ссылке в письме, затем войдите.
          </p>
          <Link href="/login" className="inline-block mt-4 text-coral font-semibold text-sm">
            Перейти ко входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="surface border border-vn rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold text-coral text-center mb-2">Регистрация</h1>
        <input
          type="text"
          placeholder="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="surface-2 border border-vn rounded-lg px-3 py-2.5 text-sm outline-none"
        />
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
          placeholder="Пароль (мин. 6 символов)"
          required
          minLength={6}
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
          {loading ? "Создаём..." : "Создать аккаунт"}
        </button>
        <p className="text-dim text-sm text-center">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-coral font-semibold">
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}

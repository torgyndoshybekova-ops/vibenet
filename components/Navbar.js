"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar({ profile }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-30 surface border-b border-vn px-4 h-14 flex items-center justify-between">
      <Link href="/" className="text-xl font-extrabold text-coral tracking-tight">
        VibeNet
      </Link>
      <div className="flex items-center gap-5 text-sm">
        <Link href="/" className="text-dim hover:text-inherit">
          Лента
        </Link>
        <Link href="/messages" className="text-dim hover:text-inherit">
          Сообщения
        </Link>
        <Link href="/profile" className="flex items-center gap-2">
          <img
            src={profile?.avatar_url || "https://api.dicebear.com/7.x/thumbs/svg?seed=" + profile?.username}
            alt=""
            className="w-7 h-7 rounded-full object-cover"
          />
        </Link>
        <button onClick={handleLogout} className="text-dim hover:text-coral">
          Выйти
        </button>
      </div>
    </nav>
  );
}

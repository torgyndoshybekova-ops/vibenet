"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function labelFor(n) {
  const name = n.actor?.username || "Кто-то";
  if (n.type === "like") return `${name} оценил(а) вашу публикацию`;
  if (n.type === "comment") return `${name} прокомментировал(а) вашу публикацию`;
  if (n.type === "follow") return `${name} подписался(ась) на вас`;
  return "Новое уведомление";
}

export default function NotificationsBell({ userId }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const supabase = createClient();
  const ref = useRef(null);

  async function load() {
    const { data } = await supabase
      .from("notifications")
      .select("*, actor:actor_id(username, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems(data || []);
  }

  useEffect(() => {
    if (!userId) return;
    load();

    const channel = supabase
      .channel("notifications-" + userId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleToggle() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      const unreadIds = items.filter((i) => !i.read).map((i) => i.id);
      if (unreadIds.length > 0) {
        await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
        setItems((prev) => prev.map((i) => ({ ...i, read: true })));
      }
    }
  }

  const unreadCount = items.filter((i) => !i.read).length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleToggle} className="relative text-lg leading-none">
        <span>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-coral text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-8 surface border border-vn rounded-xl shadow-lg w-72 max-h-96 overflow-y-auto z-30">
          <div className="px-4 py-3 font-semibold border-b border-vn text-sm">Уведомления</div>
          {items.length === 0 && (
            <p className="text-dim text-sm px-4 py-6 text-center">Пока пусто</p>
          )}
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.actor?.username ? `/u/${n.actor.username}` : "#"}
              className="flex items-center gap-3 px-4 py-3 hover:surface-2 text-sm border-b border-vn last:border-none"
            >
              <img
                src={
                  n.actor?.avatar_url ||
                  "https://api.dicebear.com/7.x/thumbs/svg?seed=" + n.actor?.username
                }
                className="w-8 h-8 rounded-full object-cover shrink-0"
                alt=""
              />
              <span>{labelFor(n)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

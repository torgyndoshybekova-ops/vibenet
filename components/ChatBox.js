"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChatBox({ currentUser, people }) {
  const [activePerson, setActivePerson] = useState(people[0] || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const supabase = createClient();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!activePerson) return;

    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${activePerson.id}),and(sender_id.eq.${activePerson.id},receiver_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });
      setMessages(data || []);
    }
    loadMessages();

    // Подписка на новые сообщения в реальном времени
    const channel = supabase
      .channel("messages-" + activePerson.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new;
          const belongsToThisChat =
            (m.sender_id === currentUser.id && m.receiver_id === activePerson.id) ||
            (m.sender_id === activePerson.id && m.receiver_id === currentUser.id);
          if (belongsToThisChat) {
            setMessages((prev) => [...prev, m]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePerson, currentUser.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || !activePerson) return;
    setText("");
    await supabase.from("messages").insert({
      sender_id: currentUser.id,
      receiver_id: activePerson.id,
      text: value,
    });
  }

  return (
    <div className="surface border border-vn rounded-2xl flex overflow-hidden" style={{ height: "70vh" }}>
      <div className="w-[220px] border-r border-vn overflow-y-auto shrink-0">
        <div className="px-4 py-3 font-bold border-b border-vn">Люди</div>
        {people.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePerson(p)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
              activePerson?.id === p.id ? "surface-2" : ""
            }`}
          >
            <img
              src={p.avatar_url || "https://api.dicebear.com/7.x/thumbs/svg?seed=" + p.username}
              className="w-8 h-8 rounded-full object-cover"
              alt=""
            />
            <span className="text-sm font-semibold truncate">{p.username}</span>
          </button>
        ))}
        {people.length === 0 && (
          <p className="text-dim text-sm px-4 py-4">
            Пока нет других пользователей. Зарегистрируйте второй аккаунт, чтобы протестировать чат.
          </p>
        )}
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {activePerson ? (
          <>
            <div className="px-4 py-3 border-b border-vn font-semibold text-sm">{activePerson.username}</div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender_id === currentUser.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="px-4 py-2 max-w-[70%] text-sm rounded-2xl"
                    style={{
                      background: m.sender_id === currentUser.id ? "#FF5470" : "var(--surface-2)",
                      color: m.sender_id === currentUser.id ? "#fff" : "var(--text)",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex items-center gap-3 px-4 py-3 border-t border-vn">
              <input
                type="text"
                placeholder="Написать сообщение..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 surface-2 border border-vn rounded-full px-4 py-2 text-sm outline-none"
              />
              <button type="submit" className="bg-coral text-white rounded-full w-9 h-9 shrink-0">
                ➤
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-dim">Выберите собеседника</div>
        )}
      </div>
    </div>
  );
}

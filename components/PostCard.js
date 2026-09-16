"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return "сейчас";
  const m = Math.floor(s / 60);
  if (m < 60) return m + " мин";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " ч";
  const d = Math.floor(h / 24);
  return d + " дн";
}

export default function PostCard({ post, currentUserId }) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const supabase = createClient();
  const router = useRouter();

  async function toggleLike() {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId });
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, user_id: currentUserId, text })
      .select("*, profiles(username)")
      .single();
    if (!error && data) {
      setComments((c) => [...c, data]);
      setCommentText("");
    }
  }

  async function deletePost() {
    if (!confirm("Удалить пост?")) return;
    await supabase.from("posts").delete().eq("id", post.id);
    router.refresh();
  }

  return (
    <article className="surface border border-vn rounded-2xl overflow-hidden mb-5">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={post.profiles?.avatar_url || "https://api.dicebear.com/7.x/thumbs/svg?seed=" + post.profiles?.username}
            className="w-9 h-9 rounded-full object-cover"
            alt=""
          />
          <div className="leading-tight">
            <div className="font-semibold text-sm">{post.profiles?.username}</div>
            {post.location && <div className="text-xs text-dim">{post.location}</div>}
          </div>
        </div>
        {post.user_id === currentUserId && (
          <button onClick={deletePost} className="text-dim text-sm">
            Удалить
          </button>
        )}
      </div>
      <img src={post.image_url} className="w-full aspect-square object-cover bg-black" alt="" />
      <div className="px-4 pt-3 flex items-center gap-4">
        <button onClick={toggleLike} className="text-2xl">
          <span style={{ color: liked ? "#FF5470" : "inherit" }}>{liked ? "♥" : "♡"}</span>
        </button>
      </div>
      <div className="px-4 pt-1 text-sm font-semibold">{likeCount} отметок «Нравится»</div>
      {post.caption && (
        <div className="px-4 pt-1 text-sm">
          <span className="font-semibold mr-1.5">{post.profiles?.username}</span>
          {post.caption}
        </div>
      )}
      <div className="px-4 pt-1 pb-2 text-xs text-dim">{timeAgo(post.created_at)} назад</div>
      <div className="px-4 pb-2 flex flex-col gap-1">
        {comments.map((c) => (
          <div key={c.id} className="text-sm">
            <span className="font-semibold mr-1.5">{c.profiles?.username}</span>
            {c.text}
          </div>
        ))}
      </div>
      <form onSubmit={submitComment} className="flex items-center gap-3 px-4 py-3 border-t border-vn">
        <input
          type="text"
          placeholder="Добавить комментарий..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
        />
        <button type="submit" className="text-coral text-sm font-semibold">
          Отправить
        </button>
      </form>
    </article>
  );
}

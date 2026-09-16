"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function FollowButton({ currentUserId, targetUserId, initialFollowing }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  if (currentUserId === targetUserId) return null;

  async function toggle() {
    setLoading(true);
    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId);
      setFollowing(false);
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: targetUserId });
      setFollowing(true);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={
        following
          ? "border border-vn text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50"
          : "bg-coral text-white text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50"
      }
    >
      {following ? "Отписаться" : "Подписаться"}
    </button>
  );
}

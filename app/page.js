import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(username, avatar_url), comments(*, profiles(username)), likes(user_id)")
    .order("created_at", { ascending: false });

  const enrichedPosts = (posts || []).map((p) => ({
    ...p,
    like_count: p.likes?.length || 0,
    liked: p.likes?.some((l) => l.user_id === user.id) || false,
  }));

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <main className="max-w-[600px] mx-auto px-3 py-6">
        <CreatePost userId={user.id} />
        {enrichedPosts.length === 0 && (
          <p className="text-center text-dim py-10">
            Пока нет постов. Опубликуйте первый!
          </p>
        )}
        {enrichedPosts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={user.id} />
        ))}
      </main>
    </div>
  );
}

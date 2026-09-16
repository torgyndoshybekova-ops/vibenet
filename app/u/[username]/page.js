import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import FollowButton from "@/components/FollowButton";

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, image_url")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  const { data: myFollow } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", user.id)
    .eq("following_id", profile.id)
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <Navbar profile={myProfile} />
      <main className="max-w-[600px] mx-auto px-3 py-6">
        <div className="surface border border-vn rounded-2xl p-6 flex items-center gap-6 mb-6 flex-wrap">
          <img
            src={
              profile.avatar_url ||
              "https://api.dicebear.com/7.x/thumbs/svg?seed=" + profile.username
            }
            className="w-20 h-20 rounded-full object-cover"
            alt=""
          />
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-lg font-bold">{profile.username}</h1>
              <FollowButton
                currentUserId={user.id}
                targetUserId={profile.id}
                initialFollowing={!!myFollow}
              />
            </div>
            {profile.name && <p className="text-sm font-semibold">{profile.name}</p>}
            <p className="text-dim text-sm">{profile.bio || ""}</p>
            <div className="flex gap-4 text-sm mt-2">
              <span>
                <strong>{posts?.length || 0}</strong> публикаций
              </span>
              <span>
                <strong>{followerCount || 0}</strong> подписчиков
              </span>
              <span>
                <strong>{followingCount || 0}</strong> подписок
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {(posts || []).map((p) => (
            <img key={p.id} src={p.image_url} className="w-full aspect-square object-cover" alt="" />
          ))}
        </div>
        {(!posts || posts.length === 0) && (
          <p className="text-center text-dim py-10">Публикаций пока нет</p>
        )}
      </main>
    </div>
  );
}

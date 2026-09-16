import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, image_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <main className="max-w-[600px] mx-auto px-3 py-6">
        <div className="surface border border-vn rounded-2xl p-6 flex items-center gap-6 mb-6">
          <img
            src={profile?.avatar_url || "https://api.dicebear.com/7.x/thumbs/svg?seed=" + profile?.username}
            className="w-20 h-20 rounded-full object-cover"
            alt=""
          />
          <div>
            <h1 className="text-lg font-bold">{profile?.username}</h1>
            <p className="text-dim text-sm">{profile?.bio || "Био ещё не заполнено"}</p>
            <p className="text-sm mt-1">
              <strong>{posts?.length || 0}</strong> публикаций
            </p>
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

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChatBox from "@/components/ChatBox";

export default async function MessagesPage() {
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

  // Все остальные пользователи — простая версия списка контактов
  const { data: people } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id);

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <main className="max-w-[900px] mx-auto px-3 py-6">
        <ChatBox currentUser={profile} people={people || []} />
      </main>
    </div>
  );
}

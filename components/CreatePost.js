"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CreatePost({ userId }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handlePublish() {
    if (!file) {
      setError("Выберите изображение");
      return;
    }
    setLoading(true);
    setError("");

    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("vibenet-media")
      .upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("vibenet-media")
      .getPublicUrl(path);

    const { error: insertError } = await supabase.from("posts").insert({
      user_id: userId,
      image_url: publicUrlData.publicUrl,
      caption,
      location,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setFile(null);
    setPreview(null);
    setCaption("");
    setLocation("");
    router.refresh();
  }

  return (
    <div className="surface border border-vn rounded-2xl p-4 mb-5 flex flex-col gap-3">
      {preview ? (
        <img src={preview} alt="" className="w-full max-h-80 object-cover rounded-xl" />
      ) : (
        <label className="border-2 border-dashed border-vn rounded-xl p-6 flex flex-col items-center gap-2 text-dim cursor-pointer text-sm">
          Выберите фото для поста
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      )}
      <input
        type="text"
        placeholder="Подпись..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="surface-2 border border-vn rounded-lg px-3 py-2 text-sm outline-none"
      />
      <input
        type="text"
        placeholder="Локация (необязательно)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="surface-2 border border-vn rounded-lg px-3 py-2 text-sm outline-none"
      />
      {error && <p className="text-coraldark text-sm">{error}</p>}
      <button
        onClick={handlePublish}
        disabled={loading}
        className="bg-coral text-white rounded-lg py-2.5 text-sm font-bold disabled:opacity-50"
      >
        {loading ? "Публикуем..." : "Опубликовать"}
      </button>
    </div>
  );
}

import { createClient } from "./client";

export async function uploadFile(
  file: File,
  folder: string = "uploads"
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("portal-assets")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("portal-assets").getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteFile(url: string): Promise<void> {
  const supabase = createClient();
  
  // Extract path from the full URL
  const match = url.match(/portal-assets\/(.+)$/);
  if (!match) return;

  const { error } = await supabase.storage
    .from("portal-assets")
    .remove([match[1]]);

  if (error) {
    console.error("Delete failed:", error.message);
  }
}


"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const url = await uploadFile(file, folder);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
          <Image
            src={value}
            alt="Uploaded image"
            width={400}
            height={200}
            className="w-full h-40 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-brand-primary hover:text-brand-primary transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-body">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-sm font-body">Click to upload image</span>
              <span className="text-xs text-gray-300">PNG, JPG up to 5MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {error && <p className="text-sm text-brand-alert font-body">{error}</p>}
    </div>
  );
}


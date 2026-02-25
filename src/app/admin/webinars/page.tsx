"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Video, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { Webinar } from "@/types/database";

const webinarSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  poster_url: z.string().min(1, "Poster image is required"),
  external_link: z.string().url("Must be a valid URL"),
});

type WebinarForm = z.infer<typeof webinarSchema>;

export default function AdminWebinarsPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WebinarForm>({
    resolver: zodResolver(webinarSchema),
    defaultValues: { title: "", poster_url: "", external_link: "" },
  });

  const posterUrl = watch("poster_url");

  const fetchWebinars = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("webinars")
      .select("id, title, external_link, created_at")
      .order("created_at", { ascending: false });
    setWebinars((data as Webinar[]) || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchWebinars();
  }, [fetchWebinars]);

  const openCreate = () => {
    setEditingId(null);
    reset({ title: "", poster_url: "", external_link: "" });
    setModalOpen(true);
  };

  const openEdit = (webinar: Webinar) => {
    setEditingId(webinar.id);
    reset({
      title: webinar.title,
      poster_url: webinar.poster_url,
      external_link: webinar.external_link,
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData: WebinarForm) => {
    setIsSubmitting(true);
    const supabase = createClient();

    if (editingId) {
      await supabase
        .from("webinars")
        .update(formData)
        .eq("id", editingId);
    } else {
      await supabase.from("webinars").insert(formData);
    }

    setModalOpen(false);
    setIsSubmitting(false);
    fetchWebinars();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await supabase.from("webinars").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchWebinars();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Webinars</h1>
          <p className="text-sm text-gray-500 font-body mt-1">
            Manage webinar banners and links.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Create
        </Button>
      </div>

      <Card noPadding>
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">
                    Link
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">
                    Created
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={4} />
                ))}
              </tbody>
            </table>
          </div>
        ) : webinars.length === 0 ? (
          <EmptyState
            icon={<Video className="w-8 h-8" />}
            title="No webinars yet"
            description="Create your first webinar to get started."
            action={
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                Create
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">
                    Link
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase font-body">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {webinars.map((webinar, i) => (
                  <motion.tr
                    key={webinar.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 text-sm font-body">
                        {webinar.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={webinar.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary text-sm flex items-center gap-1 hover:underline font-body"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-body">
                      {new Date(webinar.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(webinar)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand-primary transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(webinar.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-brand-alert transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Webinar" : "Create Webinar"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Title"
            {...register("title")}
            error={errors.title?.message}
            placeholder="Webinar title"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 font-body">
              Poster Image
            </label>
            <ImageUpload
              value={posterUrl}
              onChange={(url) => setValue("poster_url", url, { shouldValidate: true })}
              folder="webinars"
            />
            {errors.poster_url && (
              <p className="text-sm text-brand-alert font-body">
                {errors.poster_url.message}
              </p>
            )}
          </div>
          <Input
            label="External Link"
            {...register("external_link")}
            error={errors.external_link?.message}
            placeholder="https://..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Webinar"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-body">
            Are you sure you want to delete this webinar? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

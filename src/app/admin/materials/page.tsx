"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { MarketingMaterial } from "@/types/database";

const materialSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  image_url: z.string().min(1, "Image is required"),
  share_text_template: z.string().min(1, "Share text is required"),
});

type MaterialForm = z.infer<typeof materialSchema>;

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
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
  } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: { title: "", image_url: "", share_text_template: "" },
  });

  const imageUrl = watch("image_url");

  const fetchMaterials = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("marketing_materials")
      .select("*")
      .order("created_at", { ascending: false });
    setMaterials((data as MarketingMaterial[]) || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const openCreate = () => {
    setEditingId(null);
    reset({ title: "", image_url: "", share_text_template: "" });
    setModalOpen(true);
  };

  const openEdit = (material: MarketingMaterial) => {
    setEditingId(material.id);
    reset({
      title: material.title,
      image_url: material.image_url,
      share_text_template: material.share_text_template,
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData: MaterialForm) => {
    setIsSubmitting(true);
    const supabase = createClient();

    if (editingId) {
      await supabase
        .from("marketing_materials")
        .update(formData)
        .eq("id", editingId);
    } else {
      await supabase.from("marketing_materials").insert(formData);
    }

    setModalOpen(false);
    setIsSubmitting(false);
    fetchMaterials();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await supabase.from("marketing_materials").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchMaterials();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Marketing Materials
          </h1>
          <p className="text-sm text-gray-500 font-body mt-1">
            Manage shareable marketing assets.
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">Share Text</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">Created</th>
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
        ) : materials.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="w-8 h-8" />}
            title="No materials yet"
            description="Create your first marketing material."
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">Share Text</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase font-body">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materials.map((material, i) => (
                  <motion.tr
                    key={material.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 text-sm font-body">
                        {material.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500 font-body line-clamp-1 max-w-xs">
                        {material.share_text_template}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-body">
                      {new Date(material.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(material)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand-primary transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(material.id)}
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
        title={editingId ? "Edit Material" : "Create Material"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Title"
            {...register("title")}
            error={errors.title?.message}
            placeholder="Material title"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 font-body">
              Image
            </label>
            <ImageUpload
              value={imageUrl}
              onChange={(url) => setValue("image_url", url, { shouldValidate: true })}
              folder="materials"
            />
            {errors.image_url && (
              <p className="text-sm text-brand-alert font-body">
                {errors.image_url.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 font-body">
              Share Text Template
            </label>
            <textarea
              {...register("share_text_template")}
              placeholder="Text that will be shared along with the referral link..."
              rows={4}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-body placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
            />
            {errors.share_text_template && (
              <p className="text-sm text-brand-alert font-body">
                {errors.share_text_template.message}
              </p>
            )}
          </div>
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
        title="Delete Material"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-body">
            Are you sure you want to delete this material? This action cannot be undone.
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

"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  HelpCircle,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import type { FAQ } from "@/types/database";

const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  display_order: z.number().int().min(0),
});

type FAQForm = z.infer<typeof faqSchema>;

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
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
    formState: { errors },
  } = useForm<FAQForm>({
    resolver: zodResolver(faqSchema),
    defaultValues: { question: "", answer: "", display_order: 0 },
  });

  const fetchFAQs = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("faqs")
      .select("id, question, answer, display_order")
      .order("display_order", { ascending: true });
    setFaqs((data as FAQ[]) || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const openCreate = () => {
    setEditingId(null);
    reset({ question: "", answer: "", display_order: faqs.length });
    setModalOpen(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    reset({
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData: FAQForm) => {
    setIsSubmitting(true);
    const supabase = createClient();

    const payload = {
      question: formData.question,
      answer: formData.answer,
      display_order: formData.display_order,
    };

    if (editingId) {
      await supabase.from("faqs").update(payload).eq("id", editingId);
    } else {
      await supabase.from("faqs").insert(payload);
    }

    setModalOpen(false);
    setIsSubmitting(false);
    fetchFAQs();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await supabase.from("faqs").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchFAQs();
  };

  const moveOrder = async (faqId: string, direction: "up" | "down") => {
    const idx = faqs.findIndex((f) => f.id === faqId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === faqs.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const supabase = createClient();

    await Promise.all([
      supabase.from("faqs").update({ display_order: faqs[swapIdx].display_order }).eq("id", faqs[idx].id),
      supabase.from("faqs").update({ display_order: faqs[idx].display_order }).eq("id", faqs[swapIdx].id),
    ]);

    fetchFAQs();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">FAQs</h1>
          <p className="text-sm text-gray-500 font-body mt-1">
            Manage frequently asked questions. Use arrows to reorder.
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
                  <th className="px-4 py-3 w-12" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">Question</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={4} />
                ))}
              </tbody>
            </table>
          </div>
        ) : faqs.length === 0 ? (
          <EmptyState
            icon={<HelpCircle className="w-8 h-8" />}
            title="No FAQs yet"
            description="Create your first FAQ to get started."
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
                  <th className="px-4 py-3 w-12" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body w-20">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-body">
                    Question
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase font-body">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {faqs.map((faq, i) => (
                  <motion.tr
                    key={faq.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveOrder(faq.id, "up")}
                          disabled={i === 0}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveOrder(faq.id, "down")}
                          disabled={i === faqs.length - 1}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-xs font-mono">
                          {faq.display_order}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900 text-sm font-body">
                          {faq.question}
                        </span>
                        <p className="text-xs text-gray-400 font-body mt-0.5 line-clamp-1">
                          {faq.answer}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(faq)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand-primary transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(faq.id)}
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
        title={editingId ? "Edit FAQ" : "Create FAQ"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Question"
            {...register("question")}
            error={errors.question?.message}
            placeholder="What is...?"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 font-body">
              Answer
            </label>
            <textarea
              {...register("answer")}
              placeholder="Write the answer here..."
              rows={5}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-body placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
            />
            {errors.answer && (
              <p className="text-sm text-brand-alert font-body">
                {errors.answer.message}
              </p>
            )}
          </div>
          <Input
            label="Display Order"
            type="number"
            {...register("display_order", { valueAsNumber: true })}
            error={errors.display_order?.message}
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
        title="Delete FAQ"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-body">
            Are you sure you want to delete this FAQ? This action cannot be undone.
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

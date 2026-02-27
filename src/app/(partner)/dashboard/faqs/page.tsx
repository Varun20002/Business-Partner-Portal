"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Accordion } from "@/components/ui/Accordion";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FAQ } from "@/types/database";
import { useFaqs } from "@/hooks/useFaqs";

export default function FAQsPage() {
  const [faqsOverride, setFaqsOverride] = useState<FAQ[] | null>(null);
  const { data: faqsData = [], isLoading } = useFaqs();
  const faqs: FAQ[] = faqsOverride ?? faqsData;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl font-heading font-bold text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-brand-primary" />
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-gray-500 font-body">
          Find answers to common questions about the partner program.
        </p>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3"
            >
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HelpCircle className="w-8 h-8" />}
            title="No FAQs available"
            description="Frequently asked questions will appear here soon."
          />
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Accordion
            items={faqs.map((faq) => ({
              id: faq.id,
              question: faq.question,
              answer: faq.answer,
            }))}
          />
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink, Share2, ChevronLeft, ChevronRight, Sparkles, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { WebinarCardSkeleton, MaterialCardSkeleton } from "@/components/ui/Skeleton";
import { ShareModal } from "@/components/resources/ShareModal";
import type { Webinar, MarketingMaterial } from "@/types/database";
import { useRef } from "react";

export default function ResourcesPage() {
  const { profile } = useAuth();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [isLoadingWebinars, setIsLoadingWebinars] = useState(true);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    material: MarketingMaterial | null;
  }>({ isOpen: false, material: null });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchWebinars() {
      const { data } = await supabase
        .from("webinars")
        .select("*")
        .order("created_at", { ascending: false });
      setWebinars((data as Webinar[]) || []);
      setIsLoadingWebinars(false);
    }

    async function fetchMaterials() {
      const { data } = await supabase
        .from("marketing_materials")
        .select("*")
        .order("created_at", { ascending: false });
      setMaterials((data as MarketingMaterial[]) || []);
      setIsLoadingMaterials(false);
    }

    fetchWebinars();
    fetchMaterials();
  }, []);

  const visibleWebinars = useMemo(
    () => webinars.slice(0, 12),
    [webinars]
  );

  const visibleMaterials = useMemo(
    () => materials.slice(0, 12),
    [materials]
  );

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* ─── Zone 1: This Week's Happenings (Webinars) ─── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-primary" />
              This Week&apos;s Happenings
            </h2>
            <p className="text-sm text-gray-500 font-body mt-1">
              Upcoming webinars and events
            </p>
          </div>
          {webinars.length > 3 && (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isLoadingWebinars ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <WebinarCardSkeleton key={i} />
            ))}
          </div>
        ) : webinars.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Sparkles className="w-8 h-8" />}
              title="No happenings yet"
              description="Check back soon for upcoming webinars and events."
            />
          </Card>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          >
            {visibleWebinars.map((webinar, i) => (
              <motion.a
                key={webinar.id}
                href={webinar.external_link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-72 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={webinar.poster_url}
                    alt={webinar.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="288px"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-semibold text-gray-900 text-sm line-clamp-2">
                    {webinar.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-body mt-2">
                    {new Date(webinar.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>

      {/* ─── Zone 2: Shareable Assets (Marketing Materials) ─── */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-heading font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-accent" />
            Shareable Assets
          </h2>
          <p className="text-sm text-gray-500 font-body mt-1">
            Share marketing materials with your referral link
          </p>
        </div>

        {isLoadingMaterials ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <MaterialCardSkeleton key={i} />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ImageIcon className="w-8 h-8" />}
              title="No materials available"
              description="Marketing materials will appear here once added."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleMaterials.map((material, i) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={material.image_url}
                    alt={material.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-gray-900 text-sm line-clamp-1">
                    {material.title}
                  </h3>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-shrink-0 gap-1.5"
                    onClick={() =>
                      setShareModal({ isOpen: true, material })
                    }
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Share Modal */}
      {shareModal.material && profile?.uid && (
        <ShareModal
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal({ isOpen: false, material: null })}
          materialTitle={shareModal.material.title}
          shareTextTemplate={shareModal.material.share_text_template}
          uid={profile.uid}
        />
      )}
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { WebinarCardSkeleton, MaterialCardSkeleton } from "@/components/ui/Skeleton";
import { ShareModal } from "@/components/resources/ShareModal";
import type { Webinar, MarketingMaterial } from "@/types/database";
import { useWebinars } from "@/hooks/useWebinars";
import { useMarketingMaterials } from "@/hooks/useMarketingMaterials";

export default function ResourcesPage() {
  const { profile } = useAuth();
  const { data: webinars = [], isLoading: isLoadingWebinars } = useWebinars();
  const {
    data: materials = [],
    isLoading: isLoadingMaterials,
  } = useMarketingMaterials();
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    material: MarketingMaterial | null;
  }>({ isOpen: false, material: null });

  const scrollRef = useRef<HTMLDivElement>(null);

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
      <section id="shareable-assets">
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
          <WebinarCardSkeleton />
        ) : webinars.length === 0 ? (
          <div className="w-full h-72 rounded-2xl bg-gradient-to-r from-brand-primary/5 via-brand-primary/10 to-brand-primary/5 border border-brand-primary/10 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-10 h-10 text-brand-primary mx-auto mb-3" />
              <h3 className="text-lg font-heading font-semibold text-gray-900 mb-1">
                No happenings yet
              </h3>
              <p className="text-sm text-gray-600 font-body">
                Check back soon for upcoming webinars and events.
              </p>
            </div>
          </div>
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
                className="flex-shrink-0 w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <div className="relative h-[360px] w-full bg-gray-50 flex items-center justify-center">
                  <Image
                    src={webinar.poster_url}
                    alt={webinar.title}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    sizes="100vw"
                  />
                </div>
                <div className="p-5 border-t border-gray-100 flex items-center justify-between gap-4">
                  <h3 className="font-heading font-semibold text-gray-900 text-lg line-clamp-2 flex-1">
                    {webinar.title}
                  </h3>
                  <span className="flex-shrink-0 bg-brand-primary text-white px-5 py-2 rounded-full font-medium hover:bg-brand-primary/90 transition-colors flex items-center gap-2">
                    Register
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
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
                <div className="relative h-48 overflow-hidden bg-black">
                  <Image
                    src={material.image_url}
                    alt={material.title}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500"
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
          imageUrl={shareModal.material.image_url}
        />
      )}
    </div>
  );
}

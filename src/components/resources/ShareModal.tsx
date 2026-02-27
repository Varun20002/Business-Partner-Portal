"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  MessageCircle,
  Share2,
  ExternalLink,
  Instagram,
  Facebook,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { generateRefLink } from "@/lib/utils";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialTitle: string;
  shareTextTemplate: string;
  uid: string;
  imageUrl: string;
}

export function ShareModal({
  isOpen,
  onClose,
  materialTitle,
  shareTextTemplate,
  uid,
  imageUrl,
}: ShareModalProps) {
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  const refLink = generateRefLink(uid);
  const shareText = shareTextTemplate
    ? `${shareTextTemplate}\n\n${refLink}`
    : refLink;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    refLink
  )}&quote=${encodeURIComponent(shareText)}`;

  const handleInstagramShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // ignore clipboard errors; still open Instagram
    }
    window.open("https://www.instagram.com/", "_blank");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share: ${materialTitle}`}>
      <div className="space-y-5">
        {/* Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-body">
            Preview asset
          </label>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
            <div className="relative h-48 bg-black">
              <Image
                src={imageUrl}
                alt={materialTitle}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white/80">
              <p className="text-xs text-gray-500 font-body line-clamp-1">
                {materialTitle}
              </p>
              <button
                type="button"
                onClick={() => window.open(imageUrl, "_blank")}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open full size
              </button>
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-body">
            Your Referral Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-mono truncate">
              {refLink}
            </div>
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
              title="Copy link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-brand-accent" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Verification Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                verified
                  ? "bg-brand-primary border-brand-primary"
                  : "border-gray-300 group-hover:border-gray-400"
              }`}
            >
              {verified && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
          <span className="text-sm text-gray-600 font-body leading-snug">
            I verify my UID is correct and mapped to this link.
          </span>
        </label>

        {/* Social Share Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            disabled={!verified}
            className="flex-1 gap-2 bg-green-500 hover:bg-green-600"
            onClick={() => window.open(whatsappUrl, "_blank")}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!verified}
            className="flex-1 gap-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600"
            onClick={handleInstagramShare}
          >
            <Instagram className="w-4 h-4" />
            Instagram
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!verified}
            className="flex-1 gap-2 bg-[#1877F2] hover:bg-[#1458b8]"
            onClick={() => window.open(facebookUrl, "_blank")}
          >
            <Facebook className="w-4 h-4" />
            Facebook
          </Button>
        </div>
      </div>
    </Modal>
  );
}

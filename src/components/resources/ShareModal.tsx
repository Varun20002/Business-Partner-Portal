"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  MessageCircle,
  ExternalLink,
  Instagram,
  Facebook,
  Download,
  Loader2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { generateRefLink } from "@/lib/utils";
import { shareWithImage, downloadImage } from "@/lib/share";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const refLink = generateRefLink(uid);
  const shareText = shareTextTemplate
    ? `${shareTextTemplate}\n\n${refLink}`
    : refLink;

  const fileName = `${materialTitle.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    refLink
  )}&quote=${encodeURIComponent(shareText)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    shareWithImage(shareText, imageUrl, whatsappUrl, fileName);
  };

  const handleInstagramShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // ignore clipboard errors; still open Instagram
    }
    window.open("https://www.instagram.com/", "_blank");
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadImage(imageUrl, fileName);
    setIsDownloading(false);
    setDownloadDone(true);
    setTimeout(() => setDownloadDone(false), 3000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share: ${materialTitle}`}>
      <div className="space-y-4">

        {/* Image Preview */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
          <div className="relative h-36 bg-black">
            <Image
              src={imageUrl}
              alt={materialTitle}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-white/80 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-body line-clamp-1 flex-1 mr-2">
              {materialTitle}
            </p>
            <button
              type="button"
              onClick={() => window.open(imageUrl, "_blank")}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Full size
            </button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body">
            Your Referral Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-mono truncate">
              {refLink}
            </div>
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
              title="Copy link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Verification Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 flex-shrink-0">
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
            I verify my UID is correct and mapped to this referral link.
          </span>
        </label>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Share section */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body">
            Share via
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              disabled={!verified}
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 font-body">WhatsApp</span>
            </button>

            <button
              disabled={!verified}
              onClick={handleInstagramShare}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700 font-body">Instagram</span>
            </button>

            <button
              disabled={!verified}
              onClick={() => window.open(facebookUrl, "_blank")}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <div className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Facebook className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 font-body">Facebook</span>
            </button>
          </div>
        </div>

        {/* Download section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body">
            Save to device
          </p>
          <Button
            variant="secondary"
            size="md"
            disabled={isDownloading}
            onClick={handleDownload}
            className="w-full gap-2 justify-center"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading…
              </>
            ) : downloadDone ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Saved to device</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Image
              </>
            )}
          </Button>
        </div>

      </div>
    </Modal>
  );
}

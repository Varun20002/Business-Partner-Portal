"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DISCLAIMER } from "@/lib/constants";
import { generateRefLink } from "@/lib/utils";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialTitle: string;
  shareTextTemplate: string;
  uid: string;
}

export function ShareModal({
  isOpen,
  onClose,
  materialTitle,
  shareTextTemplate,
  uid,
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
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share: ${materialTitle}`}>
      <div className="space-y-5">
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

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-800 font-body leading-relaxed">
            <strong>Disclaimer:</strong> {DISCLAIMER}
          </p>
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
        <div className="flex gap-3 pt-2">
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
            className="flex-1 gap-2 bg-black hover:bg-gray-800"
            onClick={() => window.open(twitterUrl, "_blank")}
          >
            <Share2 className="w-4 h-4" />
            X (Twitter)
          </Button>
        </div>
      </div>
    </Modal>
  );
}

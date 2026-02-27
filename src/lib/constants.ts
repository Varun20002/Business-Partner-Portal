// ─── Brand Configuration ───────────────────────────────────────
export const BRAND = {
  name: "Business Partner Portal",
  tagline: "Partner Dashboard",
  terminology: "Crypto Assets", // NEVER use "Cryptocurrency"
  terminologyFull: "Virtual Digital Assets (VDA)",
} as const;

// ─── Calculator Constants ──────────────────────────────────────
export const CALCULATOR = {
  USD_RATE: 90,
  FEE_PERCENT: 0.0005, // 0.05%
  ACQUISITION_BOUNTY: 500,
  MAX_USERS_SLIDER: 200,
  FIXED_REVENUE_SHARE: 20,
} as const;

export const SLABS = [
  { threshold: 1_000_000, payout: 10_000 },
  { threshold: 2_500_000, payout: 25_000 },
  { threshold: 5_000_000, payout: 50_000 },
  { threshold: 7_500_000, payout: 75_000 },
  { threshold: 10_000_000, payout: 100_000 },
  { threshold: 20_000_000, payout: 200_000 },
  { threshold: 30_000_000, payout: 300_000 },
  { threshold: 40_000_000, payout: 400_000 },
  { threshold: 50_000_000, payout: 500_000 },
  { threshold: 60_000_000, payout: 600_000 },
  { threshold: 70_000_000, payout: 700_000 },
  { threshold: 80_000_000, payout: 800_000 },
  { threshold: 90_000_000, payout: 900_000 },
  { threshold: 100_000_000, payout: 1_000_000 },
] as const;

// ─── Mandatory Disclaimer ──────────────────────────────────────
export const DISCLAIMER =
  "Crypto products and NFTs are unregulated and can be highly risky. There may be no regulatory recourse for any loss from such transactions. For any queries, visit support.coindcx.com";

// ─── Navigation ────────────────────────────────────────────────
export const PARTNER_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Resources", href: "/dashboard/resources", icon: "BookOpen" },
] as const;

export const ADMIN_NAV = [
  { label: "Overview", href: "/admin", icon: "LayoutDashboard" },
  { label: "Webinars", href: "/admin/webinars", icon: "Video" },
  { label: "Materials", href: "/admin/materials", icon: "Image" },
  { label: "FAQs", href: "/admin/faqs", icon: "HelpCircle" },
] as const;

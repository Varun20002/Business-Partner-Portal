import { z } from "zod";

// ─── Partner UID Validation ────────────────────────────────────────
// Format: 2 letters followed by numbers (e.g., VA51243378, AD00000001)
const UID_REGEX = /^[A-Z]{2}\d+$/i;

// ─── Metrics Data Schema ───────────────────────────────────────────
export const MetricsRowSchema = z.object({
  partner_uid: z
    .string()
    .min(1, "Partner UID is required")
    .regex(UID_REGEX, "UID must be 2 letters followed by numbers (e.g., VA51243378)"),
  name: z
    .string()
    .max(255, "Name must be less than 255 characters")
    .optional()
    .default(""),
  rsr_percentage: z
    .number()
    .min(0, "RSR percentage must be non-negative")
    .max(100, "RSR percentage must be at most 100")
    .optional()
    .default(20),
  total_users: z.number().int().min(0, "Total users must be a non-negative integer"),
  traded_users: z.number().int().min(0, "Traded users must be a non-negative integer"),
  eligible_500_users: z
    .number()
    .int()
    .min(0, "Eligible 500 users must be a non-negative integer"),
  volume_eligible_users: z
    .number()
    .int()
    .min(0, "Volume eligible users must be a non-negative integer"),
  total_volume_inr: z
    .number()
    .int()
    .min(0, "Total volume (INR) must be a non-negative integer")
    .optional()
    .default(0),
  new_users: z
    .number()
    .int()
    .min(0, "New users must be a non-negative integer")
    .optional()
    .default(0),
  crossed_threshold_users: z
    .number()
    .int()
    .min(0, "Crossed threshold users must be a non-negative integer")
    .optional()
    .default(0),
  new_user_incentive_inr: z
    .number()
    .int()
    .min(0, "New user incentive must be a non-negative integer")
    .optional()
    .default(0),
  current_baseline_volume_inr: z
    .number()
    .int()
    .min(0, "Current baseline volume must be a non-negative integer")
    .optional()
    .default(0),
  incremental_volume_inr: z
    .number()
    .int()
    .min(0, "Incremental volume must be a non-negative integer")
    .optional()
    .default(0),
  volume_incentive_inr: z
    .number()
    .int()
    .min(0, "Volume incentive must be a non-negative integer")
    .optional()
    .default(0),
  volume_to_next_slab_inr: z
    .number()
    .int()
    .min(0, "Volume to next slab must be a non-negative integer")
    .optional()
    .default(0),
  next_slab_incentive_inr: z
    .number()
    .int()
    .min(0, "Next slab incentive must be a non-negative integer")
    .optional()
    .default(0),
});

export const MetricsImportSchema = z.object({
  metrics: z.array(MetricsRowSchema).min(1, "At least one metrics row is required"),
});

// ─── Type Exports ──────────────────────────────────────────────────
export type MetricsRow = z.infer<typeof MetricsRowSchema>;
export type MetricsImport = z.infer<typeof MetricsImportSchema>;

// ─── Validation Functions ──────────────────────────────────────────
export function validateMetricsRow(data: unknown): MetricsRow {
  return MetricsRowSchema.parse(data);
}

export function validateMetricsImport(data: unknown): MetricsImport {
  return MetricsImportSchema.parse(data);
}


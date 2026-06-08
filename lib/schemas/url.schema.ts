import { z } from "zod";

// ── Request body schemas (inbound deserialization) ────────────────────────────

/** POST /api/urls — create a new short URL */
export const CreateUrlSchema = z.object({
  originalUrl: z
    .string({ message: "originalUrl is required." })
    .url("originalUrl must be a valid URL."),
});

export type CreateUrlInput = z.infer<typeof CreateUrlSchema>;

// ── Route param schemas ───────────────────────────────────────────────────────

/** 7-character alphanumeric short code (matches domain rule in AGENTS.md) */
export const ShortCodeSchema = z
  .string()
  .length(7, "Short code must be exactly 7 characters.")
  .regex(/^[a-z0-9]+$/i, "Short code must be alphanumeric.");

export const ShortCodeParamSchema = z.object({
  shortCode: ShortCodeSchema,
});

export type ShortCodeParam = z.infer<typeof ShortCodeParamSchema>;

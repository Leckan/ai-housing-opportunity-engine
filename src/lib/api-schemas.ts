import { z } from "zod";

export const parcelListQuerySchema = z.object({
  q: z.string().max(160).optional().default(""),
  category: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).max(10000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const parcelSearchQuerySchema = z.object({
  q: z.string().max(160).optional().default(""),
  category: z.string().max(80).optional(),
  minArea: z.coerce.number().finite().min(0).optional().default(0),
  maxArea: z.coerce.number().finite().min(0).optional().default(0),
  minScore: z.coerce.number().finite().min(0).max(100).optional().default(0),
});

export const rankQuerySchema = z.object({
  minScore: z.coerce.number().int().min(0).max(100).optional().default(0),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const zoningQuerySchema = z.object({
  question: z.string().trim().min(1).max(1600),
  parcelId: z.string().max(100).optional(),
});

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  parcelId: z.string().max(100).optional(),
});

export const reportRequestSchema = z.object({
  parcelId: z.string().min(1).max(100),
  format: z.enum(["json", "csv"]).optional().default("json"),
});

export const feasibilityRequestSchema = z.object({
  parcelAreaSqFt: z.number().finite().nonnegative().optional(),
  densityUnitsPerAcre: z.number().finite().nonnegative().optional(),
  netToGross: z.number().finite().min(0).max(1).optional(),
  constructionCostPerSqFt: z.number().finite().nonnegative().optional(),
  landCostPerSqFt: z.number().finite().nonnegative().optional(),
  monthlyRentPerUnit: z.number().finite().nonnegative().optional(),
  unitSizeSqFt: z.number().finite().positive().optional(),
  affordableSharePct: z.number().finite().min(0).max(100).optional(),
});

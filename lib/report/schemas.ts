import { z } from "zod";

export const reportPointSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});

export const rooftopSelectionSchema = z.object({
  name: z.string().trim().max(100).default(""),
  points: z.array(reportPointSchema).min(4).max(500),
  zoom: z.number().finite().min(0).max(22).default(19),
});

export type ParsedRooftopSelection = z.infer<typeof rooftopSelectionSchema>;

const reportLocationSchema = z.object({
  locality: z.string(),
  city: z.string(),
  district: z.string(),
  state: z.string(),
  countryCode: z.string(),
});

export const reportSessionResponseSchema = z.object({
  orderId: z.string(),
  status: z.enum(["pending", "generating", "retrying", "ready", "failed"]),
  customerName: z.string(),
  selection: rooftopSelectionSchema,
  areaSqm: z.number().finite().nonnegative(),
  centroid: reportPointSchema,
  runoffCoefficient: z.number().finite().positive(),
  annualRainfallMm: z.number().finite().nonnegative().optional(),
  potentialLitres: z.number().finite().nonnegative().optional(),
  location: reportLocationSchema.optional(),
  analysis: z.array(z.string()).optional(),
  forecast: z
    .array(
      z.object({
        month: z.string(),
        monthStart: z.string(),
        rainfallMm: z.number().finite().nonnegative(),
        harvestableLitres: z.number().finite().nonnegative(),
      }),
    )
    .optional(),
  mapSnapshotType: z.string().optional(),
  steps: z.object({
    location: z.enum(["pending", "complete", "failed"]),
    rainfall: z.enum(["pending", "complete", "failed"]),
    analysis: z.enum(["pending", "complete", "failed"]),
    forecast: z.enum(["pending", "complete", "failed"]),
  }),
  lastError: z.string().optional(),
});

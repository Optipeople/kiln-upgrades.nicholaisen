import { z } from "zod";

export const EstimatorSchema = z.object({
  contact: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(160),
    job: z.string().min(1).max(120),
    company: z.string().max(160).optional(),
  }),
  kiln: z.object({
    country: z.string().min(2).max(2),
    product: z.string().min(1).max(40),
    kilns: z.number().int().min(1).max(30),
    m3: z.number().min(5).max(500),
    hours: z.number().min(500).max(8760),
    price: z.number().min(0).max(20),
    currency: z.string().min(3).max(3),
    fanpow: z.number().min(1).max(200),
    heat: z.enum(["boiler", "electric", "heatpump"]),
    age: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    inv: z.boolean(),
    healthScore: z.number().min(0).max(100),
    totalSavingsDkk: z.number().min(0),
  }),
  selectedPackage: z.string().max(60).nullable(),
  website: z.string().max(0).optional(),
});

export type EstimatorSubmission = z.infer<typeof EstimatorSchema>;

import { z } from "zod";

// Placeholder schema — extend as the calculator inputs are designed.
export const SubmissionSchema = z.object({
  contact: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(160),
    job: z.string().min(1).max(120),
    company: z.string().max(160).optional(),
  }),
  // honeypot — must be empty
  website: z.string().max(0).optional(),
});

export type Submission = z.infer<typeof SubmissionSchema>;

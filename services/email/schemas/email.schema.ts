import { z } from "zod";

export const emailSendSchema = z.object({
  body: z.object({
    sender: z.string().email().optional(),
    recipient: z.string().email(),
    subject: z.string().min(1).max(100),
    body: z.string().min(1).max(2000),
    source: z.string().min(1).max(100),
  }),
});

export type EmailSend = z.infer<typeof emailSendSchema>;

import { z } from "zod";

export const orderCreateSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    userName: z.string().min(1),
    userEmail: z.string().email(),
    cartSessionId: z.string().min(1),
  }),
});

export type OrderCreate = z.infer<typeof orderCreateSchema>;

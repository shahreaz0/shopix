import { z } from "zod";

export const addToCartSchema = z.object({
  body: z.object({
    inventoryId: z.string().min(1),
    productId: z.string().min(1),
    quantity: z.number().positive(),
  }),
});

export type AddToCart = z.infer<typeof addToCartSchema>;

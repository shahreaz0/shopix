import { z } from "zod";

export const inventoryCreateDTOSchema = z.object({
  body: z.object({
    sku: z.string(),
    productId: z.string(),
    quantity: z.number().positive().optional().default(0),
  }),
});

export const inventoryUpdateDTOSchema = z.object({
  body: z.object({
    actionType: z.enum(["IN", "OUT"]),
    quantity: z.number().positive(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export type InventoryCreateDTO = z.infer<typeof inventoryCreateDTOSchema>;
export type InventoryUpdateDTO = z.infer<typeof inventoryUpdateDTOSchema>;

import { z } from "zod";

export const inventoryCreateDTOSchema = z.object({
  body: z.object({
    sku: z.string(),
    productId: z.string(),
    quantity: z.number().default(0),
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

export const inventoryUpdateBulkDTOSchema = z.object({
  body: z.object({
    payload: z.array(
      z.object({
        actionType: z.enum(["IN", "OUT"]),
        quantity: z.number().positive(),
        id: z.string(),
      })
    ),
  }),
});

export type InventoryCreateDTO = z.infer<typeof inventoryCreateDTOSchema>;
export type InventoryUpdateDTO = z.infer<typeof inventoryUpdateDTOSchema>;
export type InventoryUpdateBulkDTO = z.infer<typeof inventoryUpdateBulkDTOSchema>;

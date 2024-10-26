import { Status } from "@prisma/client";
import { z } from "zod";

export const productCreateDTOSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    sku: z.string().min(3),
    description: z.string().optional(),
    price: z.number().optional().default(0),
    inventoryId: z.string().optional(),
    status: z.nativeEnum(Status).optional().default(Status.DRAFT),
  }),
});

export type ProductCreateDTO = z.infer<typeof productCreateDTOSchema>;

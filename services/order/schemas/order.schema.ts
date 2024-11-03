import { z } from "zod";

export const userCreateDTOSchema = z.object({
  body: z.object({
    authUserId: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    address: z.string().optional(),
    phone: z.string().optional(),
  }),
});

export const userUpdateDTOSchema = z.object({
  body: userCreateDTOSchema.shape.body.omit({ authUserId: true }).partial(),
});

export type UserCreateDTO = z.infer<typeof userCreateDTOSchema>;
export type UserUpdateDTO = z.infer<typeof userUpdateDTOSchema>;

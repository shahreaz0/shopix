import { Role } from "@prisma/client";
import { z } from "zod";

export const userRegisterDTOSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.nativeEnum(Role).optional().default(Role.USER),
  }),
});

export const userLoginDTOSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export type UserRegisterDTO = z.infer<typeof userRegisterDTOSchema>;
export type UserLoginDTO = z.infer<typeof userLoginDTOSchema>;

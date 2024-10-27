import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { validateResource } from "@/lib/validate-resource";
import { UserCreateDTO, userCreateDTOSchema } from "@/schemas/user.schema";
import express, { NextFunction, Request, Response } from "express";

export const userRouter = express.Router();

userRouter.post(
  "/",
  validateResource(userCreateDTOSchema),
  async (
    req: Request<object, object, UserCreateDTO["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { authUserId: req.body.authUserId },
      });

      if (existingUser) {
        throw new ApiError("auth user id conflict", 400);
      }

      const user = await prisma.user.create({
        data: req.body,
      });

      res.send({ message: "success", data: user });
    } catch (error) {
      console.log(error);

      next(error);
    }
  }
);

userRouter.get("/:id", async (req, res, next) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { authUserId: req.params.id },
    });

    if (!existingUser) {
      throw new ApiError("auth user id conflict", 400);
    }

    res.send({ message: "success", data: existingUser });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

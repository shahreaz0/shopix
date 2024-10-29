import { ApiError } from "@/lib/api-error";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { createLoginHistory, hashPassword, signJWT, verifyPassword } from "@/lib/utils";
import { validateResource } from "@/lib/validate-resource";
import {
  UserLoginDTO,
  userLoginDTOSchema,
  UserRegisterDTO,
  userRegisterDTOSchema,
} from "@/schemas/auth.schema";
import express, { NextFunction, Request, Response } from "express";
import xior from "xior";

export const authRouter = express.Router();

authRouter.post(
  "/register",
  validateResource(userRegisterDTOSchema),
  async (
    req: Request<object, object, UserRegisterDTO["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: req.body.email,
        },
      });

      if (existingUser) {
        throw new ApiError("Email already exist", 400);
      }

      const hashedPassword = await hashPassword(req.body.password);

      const user = await prisma.user.create({
        data: {
          ...req.body,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          verified: true,
          status: true,
        },
      });

      await xior.post(`${env.get("USER_BASE_URL")}/users`, {
        authUserId: user.id,
        name: user.name,
        email: user.email,
      });

      res.json({ message: "success", data: user });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/login",
  validateResource(userLoginDTOSchema),
  async (
    req: Request<object, object, UserLoginDTO["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "";
      const userAgent = req.headers["user-agent"] || "";

      const user = await prisma.user.findUnique({
        where: {
          email: req.body.email,
        },
      });

      if (!user) {
        throw new ApiError("Email or password is incorrect", 400);
      }

      const isVerified = await verifyPassword(user.password, req.body.password);

      if (!isVerified) {
        await createLoginHistory({
          userId: user.id,
          ipAddress: ip,
          userAgent: userAgent,
          attemptStatus: "FAILED",
        });

        throw new ApiError("Email or password is incorrect", 400);
      }

      if (!user.verified) {
        await createLoginHistory({
          userId: user.id,
          ipAddress: ip,
          userAgent: userAgent,
          attemptStatus: "FAILED",
        });
        throw new ApiError("User not verified", 400);
      }

      if (user.status !== "ACTIVE") {
        await createLoginHistory({
          userId: user.id,
          ipAddress: ip,
          userAgent: userAgent,
          attemptStatus: "FAILED",
        });
        throw new ApiError(`Your account is ${user.status.toLocaleLowerCase()}`, 400);
      }

      const accessToken = await signJWT(user, "2h");

      await createLoginHistory({
        userId: user.id,
        ipAddress: ip,
        userAgent: userAgent,
        attemptStatus: "SUCCESS",
      });

      res.json({ message: "success", data: { accessToken } });
    } catch (error) {
      next(error);
    }
  }
);

import { ApiError } from "@/lib/api-error";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  createLoginHistory,
  generateVerificationCode,
  hashPassword,
  signJWT,
  verifyPassword,
} from "@/lib/utils";
import { validateResource } from "@/lib/validate-resource";
import {
  EmailVerification,
  emailVerificationSchema,
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

      const verificationCode = generateVerificationCode(6);

      await prisma.verificationCode.create({
        data: {
          userId: user.id,
          code: verificationCode,
          expiredAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await xior.post(`${env.get("EMAIL_BASE_URL")}/emails/send`, {
        recipient: user.email,
        subject: "Email Verification",
        body: `Your verification code is ${verificationCode}`,
        source: "user-registration",
      });

      res.json({
        message: "User created. Check your email for verification code ",
        data: user,
      });
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
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          verified: true,
          status: true,
          password: true,
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

      const { password, ...rest } = user;
      const accessToken = await signJWT(rest, "2h");

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

authRouter.post(
  "/email/verify",
  validateResource(emailVerificationSchema),
  async (
    req: Request<object, object, EmailVerification["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: req.body.email,
        },
      });

      if (!user) {
        throw new ApiError("No user found with this email", 400);
      }

      const verificationCode = await prisma.verificationCode.findFirst({
        where: {
          code: req.body.code,
          userId: user.id,
        },
      });

      if (!verificationCode) {
        throw new ApiError("Invalid verification code", 400);
      }

      if (verificationCode.expiredAt < new Date()) {
        throw new ApiError("Verification code expired", 400);
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          status: "ACTIVE",
          verified: true,
        },
      });

      await prisma.verificationCode.update({
        where: {
          id: verificationCode.id,
        },
        data: {
          status: "USED",
          verifiedAt: new Date(),
        },
      });

      await xior.post(`${env.get("EMAIL_BASE_URL")}/emails/send`, {
        recipient: user.email,
        subject: "Email Verified",
        body: `Your email has been verified successfully`,
        source: "verify-email",
      });

      res.send({ message: "Email Verified Successfully", verified: true });
    } catch (error) {
      next(error);
    }
  }
);

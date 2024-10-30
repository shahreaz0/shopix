import { ApiError } from "@/lib/api-error";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/utils";
import { validateResource } from "@/lib/validate-resource";
import { emailSendSchema, EmailSend } from "@/schemas/email.schema";
import express, { NextFunction, Request, Response } from "express";

export const emailRouter = express.Router();

emailRouter.post(
  "/send",
  validateResource(emailSendSchema),
  async (
    req: Request<object, object, EmailSend["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { rejected } = await transporter.sendMail({
        to: req.body.recipient,
        from: req.body.sender || env.get("DEFAULT_SENDER_EMAIL"),
        subject: req.body.subject,
        text: req.body.body,
      });

      if (rejected.length) {
        throw new ApiError("Failed to send email", 400);
      }

      const email = await prisma.email.create({ data: req.body });

      res.send({ message: "Email send successfully", data: email });
    } catch (error) {
      console.log(error);

      next(error);
    }
  }
);

emailRouter.get("/", async (_req, res, next) => {
  try {
    const emails = await prisma.email.findMany();

    res.send({ message: "Email send successfully", data: emails });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

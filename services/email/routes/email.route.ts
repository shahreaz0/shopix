import { ApiError } from "@/lib/api-error";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/utils";
import { validateResource } from "@/lib/validate-resource";
import { emailSendSchema, EmailSend } from "@/schemas/email.schema";
import { saveEmail, sendEmail } from "@/services/email.service";
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
      const { rejected } = await sendEmail({
        to: req.body.recipient,
        from: req.body?.sender,
        subject: req.body.subject,
        text: req.body.body,
      });

      if (rejected.length) {
        throw new ApiError("Failed to send email", 400);
      }

      const email = await saveEmail({
        ...req.body,
        sender: req.body.sender,
      });

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

import nodemailer from "nodemailer";
import { env } from "./env";

export const transporter = nodemailer.createTransport({
  host: env.get("SMTP_HOST") || "smtp.ethereal.email",
  port: parseInt(env.get("SMTP_PORT") || "587"),
});

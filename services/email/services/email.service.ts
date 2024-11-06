import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/utils";

type Option = {
  to: string;
  from?: string;
  subject: string;
  text: string;
};

export async function sendEmail(option: Option) {
  try {
    option.from =
      option?.from || env.get("DEFAULT_SENDER_EMAIL") || "ashahreaz@gmail.com";

    const resp = await transporter.sendMail(option);

    return resp;
  } catch (error) {
    throw error;
  }
}

export async function saveEmail(option: {
  recipient: string;
  sender?: string;
  subject: string;
  body: string;
  source: string;
}) {
  try {
    const sender =
      option?.sender || env.get("DEFAULT_SENDER_EMAIL") || "ashahreaz@gmail.com";

    const email = await prisma.email.create({
      data: {
        ...option,
        sender,
      },
    });

    return email;
  } catch (error) {
    throw error;
  }
}

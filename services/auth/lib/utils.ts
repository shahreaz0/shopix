import argon2 from "argon2";
import * as jose from "jose";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma";
import { AccountStatus, AttemptStatus, Role } from "@prisma/client";

export async function hashPassword(password: string) {
  try {
    const hash = await argon2.hash(password);

    return hash;
  } catch (_err) {
    return "";
  }
}

export async function verifyPassword(hash: string, password: string) {
  try {
    const isVerified = await argon2.verify(hash, password);

    return isVerified;
  } catch (_err) {
    return false;
  }
}

type Payload = {
  status: AccountStatus;
  email: string;
  id: string;
  name: string;
  role: Role;
  verified: boolean;
};

export async function signJWT(payload: Payload, expiresIn = "30m") {
  try {
    const pkcs8 = await fs.readFile(path.join("certs/private.pem"), "utf8");
    const alg = "RS256";

    const privateKey = await jose.importPKCS8(pkcs8, alg);

    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime("5m")
      .setIssuer("Wu86zkDoWi6M7jKVE2JcUbJiklFOdUCI")
      .sign(privateKey);

    return jwt;
  } catch (error) {
    console.log(error);
    return "";
  }
}

export async function createLoginHistory(info: {
  userId: string;
  ipAddress: string | undefined;
  userAgent: string | undefined;
  attemptStatus: AttemptStatus;
}) {
  try {
    const loginHistory = await prisma.loginHistory.create({ data: info });

    return loginHistory;
  } catch (error) {
    console.log(error);
  }
}

export function generateVerificationCode(length: number = 10): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

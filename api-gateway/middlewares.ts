import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "./lib/utils";

export async function auth(req: Request, res: Response, next: NextFunction) {
  if (!req.headers["authorization"]) {
    res.status(401).send({ message: "Unauthorized" });
    return;
  }

  const [bearer, token] = req.headers["authorization"].split(" ");

  if (bearer !== "Bearer") {
    res.status(401).send({ message: "Unauthorized" });
    return;
  }

  const payload = await verifyJWT(token);

  if (!payload) {
    res.status(401).send({ message: "Unauthorized" });
    return;
  }

  req.headers["x-user-id"] = payload.id;

  next();
}

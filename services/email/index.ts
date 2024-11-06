import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import { emailRouter } from "@/routes/email.route";
import { ApiError } from "@/lib/api-error";
import { env } from "./lib/env";

const app = express();

import { emailReciever } from "./lib/reciever";

emailReciever();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get("/health", (_, res) => {
  res.send({ status: "ok", service: "email", timestamp: Date.now() });
});

app.use("/emails", emailRouter);

app.use((_req, _res, next) => {
  next(new ApiError("Not Found", 404));
});

app.use(((err, _req, res, _next) => {
  res.status(err.statusCode || 500);

  console.log(err.message);

  res.send({
    status: err.statusCode || 500,
    message: err.message,
    ...(err?.meta?.path && { path: err?.meta?.path }),
  });
}) as ErrorRequestHandler);

const PORT = env.get("PORT") || 4005;
app.listen(PORT, () => {
  console.log(env.get("SERVICE_NAME"));
  console.log(`http://localhost:${PORT}/health`);
});

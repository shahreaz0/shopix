import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import { cartRouter } from "@/routes/cart.route";
import { ApiError } from "@/lib/api-error";
import { env } from "./lib/env";

import { cartClearReciever } from "./lib/reciever";
import "./events/on-key-expires";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

cartClearReciever();

app.get("/health", (_, res) => {
  res.send({ status: "ok", service: "cart", timestamp: Date.now() });
});

app.use("/cart", cartRouter);

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

const PORT = env.get("PORT") || 4006;
app.listen(PORT, () => {
  console.log(env.get("SERVICE_NAME"));
  console.log(`http://localhost:${PORT}/health`);
});

import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import { productRouter } from "@/routes/product.route";
import { ApiError } from "@/lib/api-error";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get("/hc", (_, res) => {
  res.send({ status: "ok", service: "product", timestamp: Date.now() });
});

app.use("/products", productRouter);

app.use((_req, _res, next) => {
  next(new ApiError("Not Found", 404));
});

app.use(((err, _req, res, _next) => {
  res.status(err.statusCode || 500);

  console.log(err);

  res.send({
    status: err.statusCode || 500,
    message: err.message,
    ...(err?.meta?.path && { path: err?.meta?.path }),
  });
}) as ErrorRequestHandler);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}/hc`);
});

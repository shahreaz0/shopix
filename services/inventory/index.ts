import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import { inventoryRouter } from "./routes/inventory.route";
import { ApiError } from "./lib/api-error";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get("/health", (_, res) => {
  res.send({ status: "ok", service: "inventory", timestamp: Date.now() });
});

app.use("/inventories", inventoryRouter);

app.use((_req, _res, next) => {
  next(new ApiError("Not Found", 404));
});

app.use(((err, _req, res, _next) => {
  res.status(err.statusCode || 500);

  console.log(err);

  res.send({
    status: err.statusCode || 500,
    message: err.message,
    ...err?.meta,
  });
}) as ErrorRequestHandler);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}/health`);
});

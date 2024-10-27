import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import { ApiError } from "./lib/api-error";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { configureRoutes } from "./lib/configure-routes";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

// Apply the rate limiting middleware to all requests.

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use("/api", limiter);

configureRoutes(app);

app.get("/hc", (_, res) => {
  res.send({ status: "ok", service: "api-gateway", timestamp: Date.now() });
});

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

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}/hc`);
});

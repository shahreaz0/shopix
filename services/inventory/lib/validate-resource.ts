import { AnyZodObject, ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "./api-error";

const validateResource =
  (schema: AnyZodObject) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const reqSchema = await schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      req.body = reqSchema.body;
      req.params = reqSchema.params;
      req.query = reqSchema.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log(error.message);

        next(new ApiError(error.issues[0].message, 400, { path: error.issues[0].path }));
      }
    }
  };

export default validateResource;

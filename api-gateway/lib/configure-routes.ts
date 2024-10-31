import { Express, Request, Response } from "express";
import config from "@/config.json";
import xior, { XiorError } from "xior";

import * as middlewares from "@/middlewares";

type Methods = "get" | "post" | "put" | "delete";

export function getMiddlewares(names: string[]) {
  return names.map((name) => middlewares[name as keyof typeof middlewares]);
}

export function createHandler({
  hostname,
  path,
  method,
}: {
  hostname: string;
  path: string;
  method: string;
}) {
  return async (req: Request, res: Response) => {
    try {
      let url = `${hostname}${path}`;

      req.params &&
        Object.keys(req.params).forEach((key) => {
          url = url.replace(`:${key}`, req.params[key]);
        });

      const { data } = await xior.request({
        method,
        url,
        data: req.body,
        headers: {
          ...req.headers,
          "x-user-id": req.headers["x-user-id"],
        },
      });

      res.json(data);
    } catch (error) {
      if (error instanceof XiorError) {
        res.status(error.response?.status || 500).send(error.response?.data);
      }
    }
  };
}

export function configureRoutes(app: Express) {
  Object.entries(config.services).forEach(([_name, service]) => {
    const hostname = service.url;

    service.routes.forEach((route) => {
      const middlewareNames =
        "middlewares" in route ? (route?.middlewares as string[]) : [];

      route.methods.forEach((method) => {
        const handler = createHandler({ hostname, path: route.path, method });

        const middleware = getMiddlewares(middlewareNames);

        app[method as Methods](`/api${route.path}`, middleware, handler);
      });
    });
  });
}

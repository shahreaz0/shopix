import { Express, NextFunction, Request, Response } from "express";
import config from "@/config.json";
import xior, { XiorError } from "xior";

export function createHandler({
  hostname,
  path,
  method,
}: {
  hostname: string;
  path: string;
  method: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let url = `${hostname}${path}`;

      req.params &&
        Object.keys(req.params).forEach((key) => {
          console.log(key, req.params[key]);

          url = url.replace(`:${key}`, req.params[key]);
        });

      const { data } = await xior.request({
        method,
        url,
        data: req.body,
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
  Object.entries(config.services).forEach(([name, service]) => {
    const hostname = service.url;

    service.routes.forEach((route) => {
      route.methods.forEach((method) => {
        const handler = createHandler({ hostname, path: route.path, method });

        app[method as "get" | "post" | "put" | "delete"](`/api${route.path}`, handler);
      });
    });
  });
}

import { redis } from "@/lib/redis";
import { ApiError } from "@/lib/api-error";
import { validateResource } from "@/lib/validate-resource";
import { addToCartSchema, AddToCart } from "@/schemas/cart.schema";
import express, { NextFunction, Request, Response } from "express";
import { env } from "@/lib/env";

export const cartRouter = express.Router();

/**
 *  POST /cart/add
 *  GET /cart
 */

/**
 * @route POST /cart/add
 * @desc add items to to the cart
 */

cartRouter.post(
  "/add",
  validateResource(addToCartSchema),
  async (
    req: Request<object, object, AddToCart["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // check session header
      let cartSessionId = (req.headers["x-cart-session-id"] as string) || null;

      console.log({ cartSessionId });

      if (cartSessionId) {
        const exists = await redis.exists(`sessions:${cartSessionId}`);
        if (!exists) {
          const ex = await redis.exists(`cart:${cartSessionId}`);
          if (ex) await redis.del(`cart:${cartSessionId}`);
          cartSessionId = null;
        }
      }

      if (!cartSessionId) {
        const sessionUuid = crypto.randomUUID();

        await redis.setex(`sessions:${sessionUuid}`, env.get("CART_TTL")!, sessionUuid);

        // res.setHeader("x-cart-session-id", sessionUuid);

        cartSessionId = sessionUuid;
      }

      await redis.hset(
        `cart:${cartSessionId}`,
        req.body.productId,
        JSON.stringify({ inventoryId: req.body.inventoryId, quantity: req.body.quantity })
      );

      res.json({ message: "Product added", sessionId: cartSessionId });

      // if no session header
      // create new session
      // add product to the cart

      // if session
      // check session is valid or not
      //
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /cart
 * @desc get carts for a session
 */

cartRouter.get("/", async (req, res, next) => {
  try {
    const cartSessionId = req.headers["x-cart-session-id"];

    console.log(cartSessionId);

    const exists = await redis.exists(`sessions:${cartSessionId}`);
    if (!exists) {
      await redis.del(`cart:${cartSessionId}`);
    }

    const data = await redis.hgetall(`cart:${cartSessionId}`);

    res.json({ message: "success", data });
  } catch (error) {
    next(error);
  }
});

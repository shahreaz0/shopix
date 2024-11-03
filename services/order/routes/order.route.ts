import { ApiError } from "@/lib/api-error";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { validateResource } from "@/lib/validate-resource";
import { OrderCreate, orderCreateSchema } from "@/schemas/order.schema";
import express, { NextFunction, Request, Response } from "express";
import xior from "xior";

export const orderRouter = express.Router();

export type ProductResponse = {
  message: string;
  data: Product;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: null;
  price: number;
  inventoryId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  stock: number;
  stockStatus: string;
};

/**
 * route's list
 * ============
 * POST /orders/checkout
 * GET /orders
 * GET /orders/:id
 */

/**
 * @route POST /orders/checkout
 * @description create orders
 */

orderRouter.post(
  "/checkout",
  validateResource(orderCreateSchema),
  async (
    req: Request<object, object, OrderCreate["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const cartSessionId = req.body.cartSessionId;

      const { data: cartItems, status } = await xior.get<{
        message: string;
        data: { quantity: number; productId: string; inventoryId: string }[];
      }>(`${env.get("CART_SERVICE_BASE_URL")}/cart`, {
        headers: {
          "x-cart-session-id": cartSessionId,
        },
      });

      if (status !== 200) {
        throw new ApiError("Cart Not Found", 400);
      }

      if (!cartItems.data.length) {
        throw new ApiError("Cart is empty", 400);
      }

      const productDetails = await Promise.all(
        cartItems.data.map(async (item) => {
          const product = await xior
            .get<ProductResponse>(
              `${env.get("PRODUCT_SERVICE_BASE_URL")}/products/${item.productId}`
            )
            .then((res) => res.data.data);

          return {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            price: product.price,
            quantity: item.quantity,
            total: product.price * item.quantity,
          };
        })
      );

      const subTotal = productDetails.reduce((acc, curr) => acc + curr.total, 0);

      const tax = 0;

      const grandTotal = subTotal + tax;

      const order = await prisma.order.create({
        data: {
          userId: req.body.userId,
          userName: req.body.userName,
          userEmail: req.body.userEmail,
          subTotal,
          tax,
          grandTotal,
          orderItems: {
            create: productDetails,
          },
        },
      });

      await xior.get(`${env.get("CART_SERVICE_BASE_URL")}/cart/clean`, {
        headers: {
          "x-cart-session-id": cartSessionId,
        },
      });

      await xior.post(`${env.get("EMAIL_SERVICE_BASE_URL")}/emails/send`, {
        recipient: "b@d.com",
        subject: "Order Confirmed",
        body: `Thank you for your order. The order ID is ${order.id}. Total: ${grandTotal}`,
        source: "checkout",
      });

      res.json({ message: "order created", data: order });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /orders/
 * @description get orders list
 */

orderRouter.get("/", async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany();

    res.send({ message: "success", data: orders });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /orders/:id
 * @description get order details
 */

orderRouter.get("/:id", async (req, res, next) => {
  try {
    const orders = await prisma.order.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        orderItems: true,
      },
    });

    res.send({ message: "success", data: orders });
  } catch (error) {
    next(error);
  }
});

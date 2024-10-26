import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import validateResource from "@/lib/validate-resource";
import { ProductCreateDTO, productCreateDTOSchema } from "@/schemas/product.schema";
import express, { NextFunction, Request, Response } from "express";
import xior from "xior";
import { z } from "zod";

export const productRouter = express.Router();

productRouter.post(
  "/",
  validateResource(productCreateDTOSchema),
  async (
    req: Request<object, object, ProductCreateDTO["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const existingProduct = await prisma.product.findUnique({
        where: { sku: req.body.sku },
      });

      if (existingProduct) {
        throw new ApiError("sku conflict", 400);
      }

      const product = await prisma.product.create({
        data: req.body,
      });

      const { data: inventory } = await xior.post("http://localhost:4002/inventories", {
        sku: product.sku,
        productId: product.id,
      });

      const updatedProduct = await prisma.product.update({
        where: {
          id: product.id,
        },
        data: {
          inventoryId: inventory.data.id,
        },
      });

      res.send({ message: "success", data: updatedProduct });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

productRouter.get("/", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({});

    res.send({ message: "success", data: products });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

productRouter.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });

    if (product?.inventoryId === null) {
      const { data: inventory } = await xior.post(`http://localhost:4002/inventories`, {
        sku: product.sku,
        productId: product.id,
      });

      const updatedProduct = await prisma.product.update({
        where: {
          id: product.id,
        },
        data: {
          inventoryId: inventory.data.id,
        },
      });

      res.send({
        message: "success",
        data: {
          ...updatedProduct,
          stock: inventory.data.quantity || 0,
          stockStatus: inventory.data.quantity > 0 ? "In Stock" : "Out of Stock",
        },
      });

      return;
    }

    const { data: inventory } = await xior.get(
      `http://localhost:4002/inventories/${product?.inventoryId}`
    );

    res.send({
      message: "success",
      data: {
        ...product,
        stock: inventory.data.quantity || 0,
        stockStatus: inventory.data.quantity > 0 ? "In Stock" : "Out of Stock",
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

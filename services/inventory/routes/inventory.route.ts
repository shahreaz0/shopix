import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import validateResource from "@/lib/validate-resource";
import {
  InventoryCreateDTO,
  inventoryCreateDTOSchema,
  InventoryUpdateDTO,
  inventoryUpdateDTOSchema,
} from "@/schemas/inventory.schema";
import express, { NextFunction, Request, Response } from "express";

export const inventoryRouter = express.Router();

inventoryRouter.post(
  "/",
  validateResource(inventoryCreateDTOSchema),
  async (
    req: Request<object, object, InventoryCreateDTO["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inventory = await prisma.inventory.create({
        data: {
          ...req.body,
          histories: {
            create: {
              actionType: "IN",
              lastQuantity: 0,
              newQuantity: req.body.quantity,
              quantityChanged: req.body.quantity,
            },
          },
        },
        select: {
          id: true,
          quantity: true,
        },
      });

      res.status(201).send({ message: "success", data: inventory });
    } catch (error) {
      console.log(error);

      next(error);
    }
  }
);

inventoryRouter.put(
  "/:id",
  validateResource(inventoryUpdateDTOSchema),
  async (
    req: Request<InventoryUpdateDTO["params"], object, InventoryUpdateDTO["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inventory = await prisma.inventory.findUnique({
        where: { id: req.params.id },
      });

      if (!inventory) {
        throw new ApiError("Not Found", 404);
      }

      const lastHistory = await prisma.history.findFirst({
        where: {
          inventoryId: req.params.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      let newQuantity = inventory.quantity;

      if (req.body.actionType === "IN") {
        newQuantity += req.body.quantity;
      } else {
        newQuantity -= req.body.quantity;
      }

      const updatedInventory = await prisma.inventory.update({
        where: { id: req.params.id },
        data: {
          quantity: newQuantity,
          histories: {
            create: {
              actionType: req.body.actionType,
              quantityChanged: req.body.quantity,
              lastQuantity: lastHistory?.newQuantity || 0,
              newQuantity,
            },
          },
        },

        select: {
          id: true,
          quantity: true,
        },
      });

      res.send({ message: "success", data: updatedInventory });
    } catch (error) {
      console.log(error);

      next(error);
    }
  }
);

inventoryRouter.get("/:id", async (req, res, next) => {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        quantity: true,
      },
    });

    if (!inventory) {
      throw new ApiError("Not Found", 404);
    }

    res.send({ message: "success", data: inventory });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

inventoryRouter.get("/:id/details", async (req, res, next) => {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: {
        histories: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!inventory) {
      throw new ApiError("Not Found", 404);
    }

    res.send({ message: "success", data: inventory });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

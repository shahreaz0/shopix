import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import validateResource from "@/lib/validate-resource";
import {
  InventoryCreateDTO,
  inventoryCreateDTOSchema,
  InventoryUpdateBulkDTO,
  inventoryUpdateBulkDTOSchema,
  InventoryUpdateDTO,
  inventoryUpdateDTOSchema,
} from "@/schemas/inventory.schema";
import { ActionType } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";

export const inventoryRouter = express.Router();

/**
 * route's list
 * ===================
 * POST /inventories/
 * PUT /inventories/bulk
 * PUT /inventories/:id
 * GET /inventories/
 * GET /inventories/:id
 * GET /inventories/:id/details
 */

/**
 * @route POST /inventories/
 * @description create inventory with history
 */

inventoryRouter.post(
  "/",
  validateResource(inventoryCreateDTOSchema),
  async (
    req: Request<object, object, InventoryCreateDTO["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          OR: [{ sku: req.body.sku }, { productId: req.body.productId }],
        },
      });

      if (existingInventory) {
        throw new ApiError("sku or productId conflict", 400);
      }

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

/**
 * @route PUT /inventories/bulk
 * @description update many inventory with history
 */

inventoryRouter.put(
  "/bulk",
  validateResource(inventoryUpdateBulkDTOSchema),
  async (
    req: Request<object, object, InventoryUpdateBulkDTO["body"]>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inventoryIds = req.body.payload.map((e) => e.id);

      const existingInventories = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      });

      if (existingInventories.length !== inventoryIds.length) {
        const foundIds = existingInventories.map((inventory) => inventory.id);

        const missingIds = [
          ...new Set(inventoryIds.filter((id) => !foundIds.includes(id))),
        ];

        throw new ApiError("Some ids not found", 404, { foundIds, missingIds });
      }

      const updatedInventories = await Promise.allSettled(
        req.body.payload.map(
          async (item: { id: string; actionType: ActionType; quantity: number }) => {
            const inventory = await prisma.inventory.findUnique({
              where: { id: item.id },
            });

            const lastHistory = await prisma.history.findFirst({
              where: {
                inventoryId: item.id,
              },
              orderBy: {
                createdAt: "desc",
              },
            });

            let newQuantity = inventory!.quantity;
            if (item.actionType === "IN") {
              newQuantity += item.quantity;
            } else {
              newQuantity -= item.quantity;
            }

            if (newQuantity < 0) {
              throw new ApiError(
                `Inventory item ${item.id} cannot have a negative quantity`,
                400
              );
            }

            return prisma.inventory.update({
              where: { id: item.id },
              data: {
                quantity: newQuantity,
                histories: {
                  create: {
                    actionType: item.actionType,
                    quantityChanged: item.quantity,
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
          }
        )
      );

      res.send({ message: "success", data: updatedInventories });
    } catch (error) {
      console.log(error);

      next(error);
    }
  }
);

/**
 * @route PUT /inventories/:id
 * @description update one inventory with history
 */

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

      if (newQuantity < 0) {
        throw new ApiError(
          `Inventory item ${inventory.id} cannot have a negative quantity`,
          400
        );
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

/**
 * @route GET /inventories/
 * @description get inventory list
 */

inventoryRouter.get("/", async (req, res, next) => {
  try {
    const inventories = await prisma.inventory.findMany({
      select: {
        id: true,
        quantity: true,
        sku: true,
        productId: true,
      },
    });

    res.send({ message: "success", data: inventories });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

/**
 * @route GET /inventories/:id
 * @description get inventory by id
 */

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

/**
 * @route GET /inventories/:id
 * @description get inventory details
 */

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

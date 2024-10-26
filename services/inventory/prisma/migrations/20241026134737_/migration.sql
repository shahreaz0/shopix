-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "quantityChanged" INTEGER NOT NULL,
    "lastQuantity" INTEGER NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "inventoryId" TEXT NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

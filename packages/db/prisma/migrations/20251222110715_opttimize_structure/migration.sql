/*
  Warnings:

  - A unique constraint covering the columns `[sortingOrder]` on the table `Action` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `metadata` to the `Action` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "metadata" JSONB NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Action_sortingOrder_key" ON "Action"("sortingOrder");

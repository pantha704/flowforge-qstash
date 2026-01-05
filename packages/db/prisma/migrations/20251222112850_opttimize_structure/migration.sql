-- DropIndex
DROP INDEX "Action_sortingOrder_key";

-- AlterTable
ALTER TABLE "Action" ALTER COLUMN "sortingOrder" SET DEFAULT 0,
ALTER COLUMN "sortingOrder" DROP DEFAULT;
DROP SEQUENCE "action_sortingorder_seq";

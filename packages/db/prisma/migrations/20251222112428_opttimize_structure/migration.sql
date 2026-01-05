-- AlterTable
CREATE SEQUENCE action_sortingorder_seq;
ALTER TABLE "Action" ALTER COLUMN "sortingOrder" SET DEFAULT nextval('action_sortingorder_seq');
ALTER SEQUENCE action_sortingorder_seq OWNED BY "Action"."sortingOrder";

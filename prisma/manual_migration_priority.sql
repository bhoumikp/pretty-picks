-- Manual Migration for Storefront Reordering (Priority Field)
-- Apply this if Prisma db push fails locally.

-- 1. Add priority column to Category model
ALTER TABLE "Category" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

-- 2. Create index on priority for Category model
CREATE INDEX "Category_priority_idx" ON "Category"("priority");

-- 3. Add priority column to Product model
ALTER TABLE "Product" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

-- 4. Create index on priority for Product model
CREATE INDEX "Product_priority_idx" ON "Product"("priority");

-- Note: Ensure you run `npx prisma generate` after applying this script 
-- to sync your Prisma Client with the database schema if you haven't already.

-- Full Manual Migration for Soft Deletion & Storefront Reordering
-- Run this script locally in your Postgres client to apply all recent schema changes.

-- 1. User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- 2. Category
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Category_priority_idx" ON "Category"("priority");
CREATE INDEX IF NOT EXISTS "Category_archivedAt_idx" ON "Category"("archivedAt");

-- 3. Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Product_priority_idx" ON "Product"("priority");
CREATE INDEX IF NOT EXISTS "Product_archivedAt_idx" ON "Product"("archivedAt");

-- 4. Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Order_archivedAt_idx" ON "Order"("archivedAt");

-- 5. Contact
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- 6. Media
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Media_archivedAt_idx" ON "Media"("archivedAt");

-- 7. SiteSetting
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- 8. HeroBanner
ALTER TABLE "HeroBanner" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "HeroBanner_archivedAt_idx" ON "HeroBanner"("archivedAt");

-- 9. Waitlist
ALTER TABLE "Waitlist" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

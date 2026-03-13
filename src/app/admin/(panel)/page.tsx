import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const metadata = {
  title: { absolute: "Admin | Dashboard" },
};

export default async function AdminDashboard() {
  let productCount = 0;
  let orderCount = 0;
  let orders: Array<{ product?: { price?: number | null } | null }> = [];
  let dbUnavailable = false;

  try {
    const results = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.findMany({ include: { product: true } }),
    ]);
    [productCount, orderCount, orders] = results;
  } catch (error) {
    console.error("Admin dashboard DB error:", error);
    dbUnavailable = true;
  }

  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.product?.price ?? 0),
    0
  );

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
          Overview
        </p>
        <h2 className="text-2xl font-[var(--font-heading)]">Dashboard</h2>
        {dbUnavailable && (
          <div className="mt-3">
            <OfflineBanner message="Database is currently unreachable. Showing placeholder stats." />
          </div>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="soft-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
            Total products
          </p>
          <h3 className="mt-3 text-3xl font-[var(--font-heading)]">
            {productCount}
          </h3>
        </div>
        <div className="soft-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
            Total orders
          </p>
          <h3 className="mt-3 text-3xl font-[var(--font-heading)]">
            {orderCount}
          </h3>
        </div>
        <div className="soft-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
            Total revenue
          </p>
          <h3 className="mt-3 text-3xl font-[var(--font-heading)]">
            {formatCurrency(totalRevenue)}
          </h3>
        </div>
      </div>
    </div>
  );
}

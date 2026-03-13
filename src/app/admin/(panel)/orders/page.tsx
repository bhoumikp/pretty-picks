import { prisma } from "@/lib/prisma";
import AdminOrders from "@/components/admin/admin-orders";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const metadata = {
  title: { absolute: "Admin | Orders" },
};

export default async function AdminOrdersPage() {
  let orders: Array<
    Awaited<ReturnType<typeof prisma.order.findMany>>[number]
  > = [];
  let products: Array<
    Awaited<ReturnType<typeof prisma.product.findMany>>[number]
  > = [];
  let dbUnavailable = false;

  try {
    const [ordersResult, productsResult] = await Promise.all([
      prisma.order.findMany({
        include: { product: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({ orderBy: { name: "asc" } }),
    ]);
    orders = ordersResult;
    products = productsResult;
  } catch (error) {
    console.error("Admin orders DB error:", error);
    dbUnavailable = true;
  }

  const serialized = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <div className="grid gap-4">
      {dbUnavailable && <OfflineBanner />}
      <AdminOrders orders={serialized} products={products} />
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import AdminOrders from "@/components/admin/admin-orders";

export const revalidate = 0;
export const metadata = {
  title: "Orders",
};

export default async function AdminOrdersPage() {
  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  const serialized = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
  }));

  return <AdminOrders orders={serialized} products={products} />;
}

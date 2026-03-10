import { prisma } from "@/lib/prisma";
import AdminOrders from "@/components/admin/admin-orders";

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <AdminOrders orders={orders} products={products} />;
}

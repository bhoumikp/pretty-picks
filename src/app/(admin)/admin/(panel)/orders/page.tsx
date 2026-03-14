import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import AdminOrdersPanel from "@/components/admin/admin-orders-panel";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const metadata = {
  title: { absolute: "Admin | Orders" },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; q?: string; sort?: string; dir?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const pageSize = 15;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const query = (params.q ?? "").trim();
  const sort = (params.sort ?? "createdAt").trim();
  const dir = (params.dir ?? "desc").trim();
  const rawStatus = (params.status ?? "all").trim();
  const allowedSorts = new Set(["createdAt", "customerName", "status", "product"]);
  const sortKey = (allowedSorts.has(sort) ? sort : "createdAt") as
    | "createdAt"
    | "customerName"
    | "status"
    | "product";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";
  const allowedStatuses = new Set(["Pending", "Confirmed", "Shipped", "Delivered"]);
  const status = allowedStatuses.has(rawStatus) ? rawStatus : "all";

  const where = {
    ...(status !== "all" ? { status } : {}),
    ...(query
      ? {
          OR: [
            { customerName: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query, mode: "insensitive" as const } },
            { status: { contains: query, mode: "insensitive" as const } },
            { product: { name: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.OrderOrderByWithRelationInput =
    sortKey === "customerName"
      ? { customerName: dirKey }
      : sortKey === "status"
      ? { status: dirKey }
      : sortKey === "product"
      ? { product: { name: dirKey } }
      : { createdAt: dirKey };

  let orders: Array<Prisma.OrderGetPayload<{ include: { product: true } }>> = [];
  let total = 0;
  let products: Array<
    Awaited<ReturnType<typeof prisma.product.findMany>>[number]
  > = [];
  let dbUnavailable = false;

  try {
    const [ordersResult, totalResult, productsResult] = await Promise.all([
      prisma.order.findMany({
        include: { product: true },
        orderBy,
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.order.count({ where }),
      prisma.product.findMany({ orderBy: { name: "asc" } }),
    ]);
    orders = ordersResult;
    total = totalResult;
    products = productsResult;
  } catch (error) {
    console.error("Admin orders DB error:", error);
    dbUnavailable = true;
  }

  const serialized = orders.map((order) => ({
    id: order.id,
    customerName: order.customerName,
    phone: order.phone,
    status: order.status,
    productName: order.product?.name ?? null,
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <div className="grid gap-6">
      {dbUnavailable && <OfflineBanner />}
      <AdminOrdersPanel
        initialOrders={serialized}
        initialTotal={total}
        initialPage={page}
        pageSize={pageSize}
        initialQuery={query}
        initialSort={[sortKey]}
        initialDir={[dirKey]}
        initialStatus={status as "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered"}
        products={products}
      />
    </div>
  );
}

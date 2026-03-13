import { prisma } from "@/lib/prisma";
import AdminProductForm from "@/components/admin/admin-products";
import OfflineBanner from "@/components/admin/offline-banner";

export const metadata = {
  title: { absolute: "Admin | Add Product" },
};

export default async function AdminProductNewPage() {
  let categories: Array<
    Awaited<ReturnType<typeof prisma.category.findMany>>[number]
  > = [];
  let dbUnavailable = false;

  try {
    categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  } catch (error) {
    console.error("Admin product form DB error:", error);
    dbUnavailable = true;
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Catalog</p>
        <h2 className="text-2xl font-[var(--font-heading)]">Add product</h2>
      </div>
      {dbUnavailable && <OfflineBanner message="Database is currently unreachable. You can still fill the form, but saving may fail." />}
      <AdminProductForm categories={categories} />
    </div>
  );
}

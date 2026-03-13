import { prisma } from "@/lib/prisma";
import AdminCategories from "@/components/admin/admin-categories";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const metadata = {
  title: { absolute: "Admin | Categories" },
};

export default async function AdminCategoriesPage() {
  let categories: Array<
    Awaited<ReturnType<typeof prisma.category.findMany>>[number]
  > = [];
  let dbUnavailable = false;

  try {
    categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  } catch (error) {
    console.error("Admin categories DB error:", error);
    dbUnavailable = true;
  }

  return (
    <div className="grid gap-4">
      {dbUnavailable && <OfflineBanner />}
      <AdminCategories categories={categories} />
    </div>
  );
}

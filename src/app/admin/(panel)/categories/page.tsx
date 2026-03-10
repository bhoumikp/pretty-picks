import { prisma } from "@/lib/prisma";
import AdminCategories from "@/components/admin/admin-categories";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return <AdminCategories categories={categories} />;
}

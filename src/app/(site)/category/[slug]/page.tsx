import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CategoryProductsClient from "@/components/category-products-client";
import Breadcrumbs from "@/components/breadcrumbs";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const category = await prisma.category.findUnique({
    where: { slug: resolvedParams.slug },
    select: { name: true },
  });

  return {
    title: category ? `${category.name} Collection` : "Category",
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const category = await prisma.category.findUnique({
    where: { slug: resolvedParams.slug },
    select: { id: true, name: true, slug: true },
  });

  if (!category) return notFound();

  const [initialProducts, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: { categoryId: category.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        material: true,
        featured: true,
        stock: true,
        images: true,
        category: {
          select: { id: true, name: true, slug: true, image: true },
        },
      },
    }),
    prisma.product.count({ where: { categoryId: category.id } }),
  ]);

  return (
    <div className="page-shell section-pad">
      <div className="flex items-end justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/products" },
              { label: category.name },
            ]}
          />
          <p className="eyebrow">Category</p>
          <h1 className="section-title">{category.name}</h1>
          <p className="mt-2 text-sm text-[var(--pp-muted)]">
            {total} pieces available
          </p>
        </div>
        <Link href="/products" className="text-sm text-[var(--pp-gold)]">
          Back to products
        </Link>
      </div>
      <CategoryProductsClient
        initialProducts={initialProducts}
        initialTotal={total}
        categorySlug={category.slug}
      />
    </div>
  );
}

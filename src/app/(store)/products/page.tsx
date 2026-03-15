import { prisma } from "@/lib/prisma";
import ProductsClient from "@/components/products-client";
import type { CategorySummary, ProductSummary } from "@/types/catalog";

export const revalidate = 60;
export const metadata = {
  title: "Products",
  description: "Browse Pretty Picks artificial jewellery collections.",
};

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === "string" ? resolvedParams.q : "";
  const category = typeof resolvedParams.category === "string" ? resolvedParams.category : "";
  const priceCap = typeof resolvedParams.price === "string" ? Number(resolvedParams.price) : undefined;
  const sort = typeof resolvedParams.sort === "string" ? resolvedParams.sort : "";

  let products: ProductSummary[] = [];
  let categories: CategorySummary[] = [];

  try {
    [products, categories] = await Promise.all([
      prisma.product
        .findMany({
        where: { archivedAt: null, isActive: true },
        include: { category: true, _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" },
      })
        .then((items) =>
          items.map((item) => {
            const { _count, ...rest } = item;
            return { ...rest, orderCount: _count.orders };
          })
        ),
      prisma.category.findMany({ where: { archivedAt: null, isActive: true }, orderBy: { name: "asc" } }),
    ]);
  } catch (error) {
    console.error("ProductsPage: Prisma unavailable, rendering empty lists.", error);
  }

  return (
    <div className="page-shell section-pad">
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--pp-border)] bg-white p-6 pt-4 shadow-sm sm:p-8 sm:pt-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Products</p>
          <h1 className="section-title">Browse all</h1>
          <p className="mt-3 text-sm text-[var(--pp-muted)] sm:text-base">
            Discover {products.length} curated pieces crafted for effortless styling.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--pp-muted)]">
            {["Contact-first ordering", "Under ₹199 picks", "Fast dispatch"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--pp-border)] bg-[var(--pp-beige)]/60 px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-20 h-40 w-40 rounded-full bg-[var(--pp-beige)]/70" />
      </div>
      <div className="mt-10">
        <ProductsClient
          products={products}
          categories={categories}
          initialQuery={query}
          initialCategory={category}
          initialPriceCap={priceCap}
          initialSort={sort}
        />
      </div>
    </div>
  );
}

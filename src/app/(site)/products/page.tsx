import { prisma } from "@/lib/prisma";
import ProductsClient from "@/components/products-client";

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

  const filters = [];
  if (query) {
    filters.push({
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { category: { name: { contains: query, mode: "insensitive" as const } } },
      ],
    });
  }
  if (category) {
    filters.push({ category: { slug: category } });
  }
  if (typeof priceCap === "number" && !Number.isNaN(priceCap)) {
    filters.push({ price: { lte: priceCap } });
  }
  const where = filters.length ? { AND: filters } : {};

  const [categories, totalCount, filteredTotal, initialProducts] = await prisma.$transaction([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.count(),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
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
  ]);

  const headerCount = query || category || typeof priceCap === "number" ? filteredTotal : totalCount;

  return (
    <div className="page-shell section-pad">
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--pp-border)] bg-white p-6 pt-4 shadow-sm sm:p-8 sm:pt-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Products</p>
          <h1 className="section-title">Browse all</h1>
          <p className="mt-3 text-sm text-[var(--pp-muted)] sm:text-base">
            Discover {headerCount} curated pieces crafted for effortless styling.
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
          initialProducts={initialProducts}
          initialTotal={filteredTotal}
          categories={categories}
          initialQuery={query}
          initialCategory={category}
          initialPriceCap={priceCap}
        />
      </div>
    </div>
  );
}

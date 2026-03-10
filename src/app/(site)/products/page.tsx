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

  const [products, categories] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="page-shell section-pad">
      <div className="relative overflow-hidden rounded-2xl bg-[var(--pp-beige)] p-6 shadow-sm sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[url('/images/hero.svg')] bg-cover bg-center opacity-10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-transparent" />
        <div className="relative max-w-2xl">
          <p className="eyebrow">Products</p>
          <h1 className="section-title">Browse all</h1>
          <p className="mt-3 text-sm text-[var(--pp-muted)] sm:text-base">
            Discover {products.length} curated pieces crafted for effortless styling.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--pp-muted)]">
            {["WhatsApp-first ordering", "Under ₹199 picks", "Fast dispatch"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--pp-border)] bg-white px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-10">
        <ProductsClient
          products={products}
          categories={categories}
          initialQuery={query}
          initialCategory={category}
        />
      </div>
    </div>
  );
}

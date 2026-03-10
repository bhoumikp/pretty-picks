import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import ProductGrid from "@/components/product-grid";
import Breadcrumbs from "@/components/breadcrumbs";
import ProductGallery from "@/components/product-gallery";
import ProductOrderActions from "@/components/product-order-actions";
import { siteConfig } from "@/data/site";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
    select: { name: true, description: true },
  });

  if (!product) {
    return { title: "Product" };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
    include: { category: true },
  });

  if (!product) return notFound();

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      NOT: { id: product.id },
    },
    take: 4,
    include: { category: true },
  });

  const productUrl = `https://${siteConfig.domain}/products/${product.slug}`;

  return (
    <div className="page-shell section-pad pb-24 md:pb-12">
      <div className="grid gap-10 md:grid-cols-[1.05fr_0.95fr]">
        <ProductGallery images={product.images} name={product.name} />
        <div>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: product.category.name, href: `/category/${product.category.slug}` },
              { label: product.name },
            ]}
          />
          <p className="eyebrow">{product.category.name}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="mt-2 text-lg font-medium tracking-wide text-[var(--pp-gold)]">
            {formatCurrency(product.price)}
          </p>
          <p className="mt-4 text-base leading-relaxed text-[var(--pp-muted)]">
            {product.description}
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            <div className="flex items-center justify-between border-b border-[var(--pp-border)] pb-2">
              <span className="text-[var(--pp-muted)]">Material</span>
              <span className="font-medium">{product.material}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--pp-border)] pb-2">
              <span className="text-[var(--pp-muted)]">Category</span>
              <Link href={`/category/${product.category.slug}`} className="font-medium">
                {product.category.name}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--pp-muted)]">Stock</span>
              <span className="font-medium">{product.stock} pieces</span>
            </div>
          </div>
          <ProductOrderActions
            name={product.name}
            price={product.price}
            productUrl={productUrl}
          />
          <div className="mt-6">
            <Link href="/products" className="btn-outline text-sm">
              Back to products
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="section-kicker">Related</p>
            <h2 className="section-title">Similar picks</h2>
          </div>
          <Link href={`/category/${product.category.slug}`} className="text-sm text-[var(--pp-gold)]">
            View category
          </Link>
        </div>
        <ProductGrid products={related} />
      </section>
    </div>
  );
}

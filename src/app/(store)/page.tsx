import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { instagramPosts, siteConfig, trustBadges } from "@/data/site";
import ProductCard from "@/components/product-card";
import CategoryCard from "@/components/category-card";
import { primaryImage } from "@/lib/images";
import type { CategorySummary, ProductSummary } from "@/types/catalog";

export const revalidate = 60;
export const metadata = {
  title: "Home",
  description: "Affordable artificial jewellery curated for Instagram-ready looks.",
};

export default async function HomePage() {
  let mostLovedProducts: ProductSummary[] = [];
  let categories: CategorySummary[] = [];
  let under199: ProductSummary[] = [];

  try {
    const [lovedResult, categoriesResult, underResult] = await Promise.allSettled([
      prisma.product.findMany({
        where: { archivedAt: null, isActive: true },
        take: 4,
        orderBy: [{ orders: { _count: "desc" } }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          createdAt: true,
          material: true,
          stock: true,
          images: true,
          _count: { select: { orders: true } },
          category: {
            select: { id: true, name: true, slug: true, image: true },
          },
        },
      }),
      prisma.category.findMany({
        where: { archivedAt: null, isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, image: true },
      }),
      prisma.product.findMany({
        where: { price: { lte: 199 }, archivedAt: null, isActive: true },
        take: 3,
        orderBy: { price: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
        },
      }),
    ]);
    if (lovedResult.status === "fulfilled") {
      mostLovedProducts = lovedResult.value.map((product) => {
        const { _count, ...rest } = product;
        return {
          ...rest,
          orderCount: _count.orders,
        };
      });
    }
    if (categoriesResult.status === "fulfilled") {
      categories = categoriesResult.value;
    }
    if (underResult.status === "fulfilled") {
      under199 = underResult.value;
    }
  } catch (error) {
    console.error("HomePage: Prisma unavailable, rendering empty lists.", error);
  }

  return (
    <div className="bg-white">
      <section id="categories" className="section-pad">
        <div className="page-shell">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="fade-in">
              <p className="eyebrow">Pretty Picks</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--pp-ink)] sm:text-4xl md:text-5xl">
                Affordable Jewellery for Everyday Elegance
              </h1>
              <p className="mt-4 text-base leading-relaxed text-[var(--pp-muted)]">
                Curated pieces that elevate your everyday style. Instagram-friendly,
                lightweight, and designed to shine on every reel.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/products" className="btn-primary btn-sweep text-sm">
                  <span className="btn-sweep-label">Shop Collection</span>
                </Link>
                <Link href="/products" className="btn-secondary text-sm">
                  View Best Sellers
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-3 text-xs text-[var(--pp-muted)] sm:grid-cols-2">
                {trustBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-xl border border-[var(--pp-border)] bg-[var(--pp-beige)] px-3 py-2"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative h-[360px] overflow-hidden rounded-[28px] bg-[var(--pp-beige)] shadow-sm sm:h-[420px] lg:h-[520px]">
                <Image
                  src="/images/hero.svg"
                  alt="Pretty Picks jewellery"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/40" />
              </div>
              <div className="absolute -bottom-6 right-6 hidden rounded-2xl border border-[var(--pp-border)] bg-white/90 p-4 text-xs shadow-lg backdrop-blur md:block">
                <p className="font-semibold">Instagram-first pieces</p>
                <p className="mt-1 text-[var(--pp-muted)]">
                  Lightweight, anti-tarnish, and reel-ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-shell">
          <div className="mb-6">
            <div>
              <p className="eyebrow">Most loved</p>
              <h2 className="section-title">Most loved</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mostLovedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-6 flex justify-center">
              <Link href="/products?sort=popular" className="btn-primary btn-sweep text-sm">
                <span className="btn-sweep-label">View All</span>
              </Link>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-shell">
          <div className="mb-6">
            <p className="eyebrow">Categories</p>
            <h2 className="section-title">Shop by mood</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-shell">
          <div className="rounded-xl bg-[var(--pp-beige)] p-8 shadow-sm md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="eyebrow">Shop under ₹199</p>
                <h2 className="mt-3 text-3xl font-[var(--font-heading)]">
                  Small price, big sparkle
                </h2>
                <p className="mt-3 text-sm text-[var(--pp-muted)]">
                  Budget-friendly picks that still look premium. Perfect for gifting
                  or styling every day.
                </p>
                <div className="mt-5">
                  <Link href="/products?price=199" className="btn-primary btn-sweep text-sm">
                    <span className="btn-sweep-label">Explore Collection</span>
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {under199.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="rounded-xl bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--pp-beige)]">
                      <Image
                        src={primaryImage(product.images)}
                        alt={product.name}
                        fill
                        className="object-cover transition-all duration-300 hover:scale-105"
                      />
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-semibold">{product.name}</p>
                      <p className="text-xs text-[var(--pp-muted)]">₹{product.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-shell">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="eyebrow">Instagram</p>
              <h2 className="section-title">Follow us on Instagram</h2>
            </div>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm"
            >
              View Instagram
            </a>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:pp-scrollbar sm:flex sm:gap-4 sm:overflow-x-auto sm:pb-3 sm:pt-1 sm:-mx-1 sm:px-1 sm:snap-x sm:snap-mandatory">
            {instagramPosts.map((post) => (
              <a
                key={post.postUrl}
                href={post.postUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-square w-full overflow-hidden bg-[var(--pp-beige)] sm:w-[160px] sm:shrink-0 sm:snap-start md:w-[180px] lg:w-[200px]"
              >
                <Image
                  src={post.imageUrl}
                  alt={post.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

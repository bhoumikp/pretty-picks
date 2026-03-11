import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { siteConfig, trustBadges } from "@/data/site";
import ProductGrid from "@/components/product-grid";
import CategoryCard from "@/components/category-card";
import { primaryImage } from "@/lib/images";

export const revalidate = 60;
export const metadata = {
  title: "Home",
  description: "Affordable artificial jewellery curated for Instagram-ready looks.",
};

export default async function HomePage() {
  const [featuredProducts, categories, under199] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true },
      take: 6,
      orderBy: { createdAt: "desc" },
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
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, image: true },
    }),
    prisma.product.findMany({
      where: { price: { lte: 199 } },
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

  return (
    <div>
      <section className="section-pad">
        <div className="page-shell">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <p className="eyebrow">Pretty Picks</p>
              <h1 className="font-[var(--font-heading)] text-4xl font-medium tracking-tight text-[var(--pp-ink)] sm:text-5xl">
                Everyday sparkle, styled for reels.
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-[var(--pp-muted)]">
                Premium-looking artificial jewellery designed for Instagram-first style.
                Lightweight, anti-tarnish, and ready to elevate every outfit.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/products" className="btn-primary text-sm">
                  Shop collection
                </Link>
                <Link href="/products" className="btn-outline text-sm">
                  Best sellers
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--pp-muted)]">
                {trustBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-[var(--pp-border)] bg-white/80 px-4 py-2"
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
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">Featured</p>
              <h2 className="section-title">Trending right now</h2>
            </div>
            <Link href="/products" className="text-sm text-[var(--pp-gold)]">
              View all
            </Link>
          </div>
          <div className="rounded-[28px] bg-[var(--pp-beige)]/70 p-6 md:p-8">
            <ProductGrid products={featuredProducts} variant="scroll" />
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-shell">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="eyebrow">Categories</p>
              <h2 className="section-title">Shop by vibe</h2>
            </div>
            <Link href="/products" className="text-sm text-[var(--pp-gold)]">
              Explore all
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-[28px] border border-[var(--pp-border)] bg-white px-6 py-10 md:px-10 lg:px-14">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <p className="eyebrow">Shop under ₹199</p>
                <h2 className="mt-4 font-[var(--font-heading)] text-3xl font-medium tracking-tight">
                  Small price, big sparkle
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[var(--pp-muted)]">
                  Budget-friendly picks that still feel premium. Perfect for gifting or styling
                  every day.
                </p>
                <div className="mt-6">
                  <Link href="/products?price=199" className="btn-primary text-sm">
                    Explore collection
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {under199.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="rounded-2xl border border-[var(--pp-border)] bg-[var(--pp-beige)]/50 p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
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
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[var(--pp-beige)]/70" />
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
              className="btn-outline text-sm"
            >
              View Instagram
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div
                key={index}
                className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--pp-beige)]"
              >
                <Image
                  src={`/images/product-${index}.svg`}
                  alt="Instagram gallery"
                  fill
                  className="object-cover transition-all duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

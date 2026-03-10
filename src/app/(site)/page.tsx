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
      include: { category: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { price: { lte: 199 } },
      include: { category: true },
      take: 3,
      orderBy: { price: "asc" },
    }),
  ]);

  return (
    <div>
      <section className="section-pad">
        <div className="page-shell grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
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
              <Link href="/products" className="btn-primary text-sm">
                Shop Collection
              </Link>
              <Link href="/products" className="btn-outline text-sm">
                View Best Sellers
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-[var(--pp-muted)]">
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
          <div className="relative h-[280px] overflow-hidden rounded-xl shadow-sm sm:h-[360px] md:h-[460px]">
            <Image
              src="/images/hero.svg"
              alt="Pretty Picks jewellery"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent" />
          </div>
        </div>
      </section>

      <section className="section-pad">
          <div className="page-shell">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">Featured</p>
              <h2 className="section-title">Most loved</h2>
            </div>
            <Link href="/products" className="text-sm text-[var(--pp-gold)]">
              View all
            </Link>
          </div>
        <ProductGrid products={featuredProducts} variant="scroll" />
        </div>
      </section>

      <section className="section-pad bg-[var(--pp-beige)]">
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
              <Link href="/products?price=199" className="btn-primary text-sm">
                Explore Collection
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
            <a href={siteConfig.instagramUrl} target="_blank" rel="noreferrer" className="btn-outline text-sm">
              View Instagram
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-xl bg-[var(--pp-beige)]">
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

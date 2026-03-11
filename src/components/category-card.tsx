import Image from "next/image";
import Link from "next/link";
import type { CategorySummary } from "@/types/catalog";

interface CategoryCardProps {
  category: CategorySummary;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const image = category.image ?? "/images/placeholder.svg";
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group overflow-hidden rounded-3xl border border-[var(--pp-border)] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--pp-beige)]">
        <Image
          src={image}
          alt={category.name}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-110"
        />
      </div>
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{category.name}</h3>
          <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--pp-muted)]">
            View collection
          </p>
        </div>
        <span className="text-sm text-[var(--pp-gold)]">→</span>
      </div>
    </Link>
  );
}

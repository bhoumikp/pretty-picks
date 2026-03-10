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
      className="soft-card card-hover group flex items-center gap-4 rounded-xl p-4"
    >
      <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-[var(--pp-beige)]">
        <Image
          src={image}
          alt={category.name}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-105"
        />
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-tight">{category.name}</h3>
        <p className="text-xs text-[var(--pp-muted)]">View collection</p>
      </div>
      <span className="ml-auto text-xs text-[var(--pp-gold)]">→</span>
    </Link>
  );
}

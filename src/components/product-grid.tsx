import type { ProductSummary } from "@/types/catalog";
import ProductCard from "@/components/product-card";

interface ProductGridProps {
  products: ProductSummary[];
  variant?: "grid" | "scroll";
}

export default function ProductGrid({ products, variant = "grid" }: ProductGridProps) {
  const isScroll = variant === "scroll";
  return (
    <div
      className={
        isScroll
          ? "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
          : "grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3 xl:grid-cols-4"
      }
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant={variant} />
      ))}
    </div>
  );
}

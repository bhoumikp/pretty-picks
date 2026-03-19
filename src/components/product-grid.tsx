import type { ProductSummary } from "@/types/catalog";
import ProductCard from "@/components/product-card";

interface ProductGridProps {
	products: ProductSummary[];
	variant?: "grid" | "scroll";
	size?: "default" | "compact";
	isLaunchMode?: boolean;
}

export default function ProductGrid({
	products,
	variant = "grid",
	size = "default",
	isLaunchMode = false,
}: ProductGridProps) {
	const isScroll = variant === "scroll";
	return (
		<div
			className={
				isScroll
					? "flex w-full max-w-full snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:gap-6 md:gap-7 lg:grid lg:snap-none lg:grid-cols-4 lg:gap-5 lg:overflow-visible xl:grid-cols-5 2xl:grid-cols-6"
					: "grid w-full max-w-full grid-cols-2 gap-x-3 gap-y-8 sm:gap-6 md:grid-cols-3 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10 xl:grid-cols-3 2xl:grid-cols-5"
			}
		>
			{products.map((product, idx) => (
				<ProductCard 
					key={product.id} 
					product={product} 
					variant={variant} 
					index={idx} 
					size={size} 
					isLaunchMode={isLaunchMode}
				/>
			))}
		</div>
	);
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import ProductGrid from "@/components/product-grid";
import ProductCard from "@/components/product-card";
import { trackEvent } from "@/lib/analytics";
import type { CategorySummary, ProductSummary } from "@/types/catalog";

interface ProductsClientProps {
	products: ProductSummary[];
	categories: CategorySummary[];
	initialQuery: string;
	initialCategory: string;
	initialPriceCap?: number;
	initialSort?: string;
	isLaunchMode?: boolean;
}

const MATERIALS = ["Alloy", "Enamel", "Faux Pearl", "Anti-tarnish"];

export default function ProductsClient({
	products,
	categories,
	initialQuery,
	initialCategory,
	initialPriceCap,
	initialSort = "newest",
	isLaunchMode = false,
}: ProductsClientProps) {
	const [query, setQuery] = useState(initialQuery);
	const [category, setCategory] = useState(initialCategory);
	const [priceRange, setPriceRange] = useState<[number, number]>(() =>
		typeof initialPriceCap === "number" && !Number.isNaN(initialPriceCap)
			? [0, initialPriceCap]
			: [0, 999]
	);
	const [material, setMaterial] = useState("");
	const [sort, setSort] = useState(initialSort);
	const [visible, setVisible] = useState(8);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [sortOpen, setSortOpen] = useState(false);
	const sortRef = useRef<HTMLDivElement | null>(null);

	const sortOptions = [
		{ value: "newest", label: "Newest" },
		{ value: "price-low", label: "Price: low to high" },
		{ value: "price-high", label: "Price: high to low" },
		{ value: "popular", label: "Most loved" },
	];

	const filtered = useMemo(() => {
		const result = products.filter((product) => {
			const nameMatch = product.name.toLowerCase().includes(query.toLowerCase());
			const categoryMatch = category ? product.category?.slug === category : true;
			const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
			const materialMatch = material
				? String(product.material ?? "").toLowerCase().includes(material.toLowerCase())
				: true;
			return nameMatch && categoryMatch && priceMatch && materialMatch;
		});

		switch (sort) {
			case "price-low":
				return [...result].sort((a, b) => a.price - b.price);
			case "price-high":
				return [...result].sort((a, b) => b.price - a.price);
			case "popular":
				return [...result].sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0));
			default:
				return result;
		}
	}, [products, query, category, priceRange, material, sort]);

	const visibleItems = filtered.slice(0, visible);

	const categoryLabel = category
		? categories.find((item) => item.slug === category)?.name ?? category
		: "";
	const activeFilters = useMemo(
		() =>
			[
				query
					? { label: `Search: ${query}`, onRemove: () => setQuery("") }
					: null,
				category
					? { label: `Category: ${categoryLabel}`, onRemove: () => setCategory("") }
					: null,
				// material
				// 	? { label: `Material: ${material}`, onRemove: () => setMaterial("") }
				// 	: null,
				priceRange[1] < 999
					? { label: `Under ₹${priceRange[1]}`, onRemove: () => setPriceRange([0, 999]) }
					: null,
			].filter(Boolean) as { label: string; onRemove: () => void }[],
		[query, category, categoryLabel, material, priceRange]
	);

	const clearFilters = () => {
		setQuery("");
		setCategory("");
		setMaterial("");
		setPriceRange([0, 999]);
		setSort("newest");
		setVisible(8);
	};

	useEffect(() => {
		const handler = (event: MouseEvent) => {
			if (!sortRef.current) return;
			if (!sortRef.current.contains(event.target as Node)) {
				setSortOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	return (
		<>
			{/* ── Premium Editorial Hero Strip ── */}
			<div className="relative mb-10 overflow-hidden rounded-3xl border border-[var(--pp-gold)]/20 bg-[var(--pp-beige)]/60 py-10 text-center sm:py-12">
				{/* subtle dot-grid pattern via radial gradients */}
				<div
					className="pointer-events-none absolute inset-0 opacity-30"
					style={{
						backgroundImage: `radial-gradient(circle, var(--pp-gold) 1px, transparent 1px)`,
						backgroundSize: "28px 28px",
					}}
				/>
				{/* corner glow accents */}
				<div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-[var(--pp-gold)]/20 blur-3xl" />
				<div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-[var(--pp-beige)] blur-3xl" />

				{/* content */}
				<div className="relative z-10">
					{/* top ornamental rule */}
					<div className="flex items-center justify-center gap-4">
						<span className="h-px flex-1 max-w-20 bg-[var(--pp-gold)]/50" />
						<span className="text-[8px] font-bold uppercase tracking-[0.5em] text-[var(--pp-gold)]">
							Pretty&nbsp;Picks
						</span>
						<span className="h-px flex-1 max-w-20 bg-[var(--pp-gold)]/50" />
					</div>

					{/* Main headline */}
					<h1 className="mt-4 px-4 font-[var(--font-heading)] text-2xl font-light tracking-wide text-[var(--pp-ink)] sm:text-4xl md:text-5xl">
						{query ? "Search" : category ? categoryLabel : "Elegance"} with{" "}
						<span className="italic font-normal text-[var(--pp-gold)]">
							{query ? `"${query}"` : category ? "Collection" : "Every Piece"}
						</span>
					</h1>

					{/* subtitle */}
					<p className="mx-auto mt-2 md:mt-4 px-4 text-center text-[8px] uppercase tracking-[0.3em] text-[var(--pp-muted)] sm:whitespace-nowrap sm:text-[10px]">
						{sort === "popular"
							? "Our Most Loved Pieces"
							: query
								? `Found ${filtered.length} matching items`
								: `${products.length} curated pieces`}{" "}
						<span className="text-[var(--pp-gold)] opacity-70">&bull;</span>{" "}
						Anti-tarnish jewellery
					</p>

					{/* bottom ornamental rule with diamond */}
					<div className="mt-5 flex items-center justify-center gap-3">
						<span className="h-px flex-1 max-w-16 bg-[var(--pp-gold)]/30" />
						<span className="inline-block h-2 w-2 rotate-45 border border-[var(--pp-gold)]/70" />
						<span className="h-px flex-1 max-w-16 bg-[var(--pp-gold)]/30" />
					</div>
				</div>
			</div>

			<div className="grid gap-12 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
				<aside className="hidden lg:block">
					<div className="sticky top-36">
						<div className="rounded-3xl border border-[var(--pp-border)] p-6 bg-white shadow-sm">
							<h3 className="text-sm font-bold uppercase tracking-[0.2em]">
								Filters
							</h3>
							<div className="mt-5 divide text-sm">
								<div className="space-y-2">
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
										Category
									</p>
									<div className="flex flex-wrap gap-2">
										<button
											className={`group flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all hover:border-[var(--pp-gold)] ${!category
												? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)] shadow-sm"
												: "border-[var(--pp-border)] bg-white text-[var(--pp-muted)] hover:text-[var(--pp-ink)]"
												}`}
											onClick={() => {
												setCategory("");
												trackEvent("filter_used", { type: "category", value: "all" });
											}}
										>
											All
										</button>
										{categories.map((item) => (
											<button
												key={item.id}
												className={`group flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all hover:border-[var(--pp-gold)] ${category === item.slug
													? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)] shadow-sm"
													: "border-[var(--pp-border)] bg-white text-[var(--pp-muted)] hover:text-[var(--pp-ink)]"
													}`}
												onClick={() => {
													setCategory(item.slug);
													trackEvent("filter_used", { type: "category", value: item.slug });
												}}
											>
												{item.name}
											</button>
										))}
									</div>
								</div>
								<div className="space-y-2 pt-6">
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
										Price Range
									</p>
									<div className="flex flex-wrap gap-2">
										{[199, 299, 499].map((value) => (
											<button
												key={value}
												className={`group flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all hover:border-[var(--pp-gold)] ${priceRange[1] === value
													? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)] shadow-sm"
													: "border-[var(--pp-border)] bg-white text-[var(--pp-muted)] hover:text-[var(--pp-ink)]"
													}`}
												onClick={() => {
													setPriceRange([0, value]);
													trackEvent("filter_used", { type: "price", value });
												}}
											>
												Under ₹{value}
											</button>
										))}
									</div>
								</div>
								{/* Material Filter hidden for now */}
								{/* <div className="space-y-2 pt-6">
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
									Material
								</p>
								<div className="flex flex-wrap gap-2">
									{MATERIALS.map((item) => (
										<button
											key={item}
											className={`group flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all hover:border-[var(--pp-gold)] ${material === item
												? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)] shadow-sm"
												: "border-[var(--pp-border)] bg-white text-[var(--pp-muted)] hover:text-[var(--pp-ink)]"
												}`}
											onClick={() => {
												setMaterial(item);
												trackEvent("filter_used", { type: "material", value: item });
											}}
										>
											{item}
										</button>
									))}
								</div>
							</div> */}
								<div className="pt-8">
									<button
										className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pp-ink)] transition-colors hover:text-[var(--pp-gold)]"
										onClick={clearFilters}
									>
										<span>Reset all</span>
										<span className="h-px w-6 bg-current opacity-20 transition-all group-hover:w-10" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</aside>

				<div className="space-y-8">
					<div className="flex flex-col gap-4 border-b border-[var(--pp-border)] pb-4 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex items-center gap-3">
							<div className="relative flex-1 lg:w-72">
								<svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<circle cx="11" cy="11" r="7" strokeWidth="1.6" />
									<path d="M20 20l-3.5-3.5" strokeWidth="1.6" strokeLinecap="round" />
								</svg>
								<input
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Search pieces..."
									className="w-full rounded-2xl border border-[var(--pp-border)] bg-white py-2.5 pl-11 pr-4 text-sm transition-all focus:border-[var(--pp-gold)] focus:outline-none focus:ring-4 focus:ring-[var(--pp-gold)]/5"
								/>
							</div>
							<button
								className="flex items-center gap-2 rounded-2xl border border-[var(--pp-border)] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--pp-ink)] transition-all hover:border-[var(--pp-gold)] active:scale-95 lg:hidden"
								onClick={() => setFiltersOpen((prev) => !prev)}
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path d="M4 6h16M4 12h10M4 18h16" strokeWidth="1.8" strokeLinecap="round" />
								</svg>
								Filters
							</button>
						</div>
						<div className="flex items-center justify-between gap-4 lg:justify-end">
							<p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--pp-muted)]">
								Showing <span className="text-[var(--pp-ink)]">{filtered.length}</span> / {products.length}
							</p>
							<div className="relative" ref={sortRef}>
								<button
									className="group flex items-center gap-3 rounded-2xl border border-[var(--pp-border)] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--pp-ink)] transition-all hover:border-[var(--pp-gold)]"
									onClick={() => setSortOpen((prev) => !prev)}
									type="button"
								>
									<span>{sortOptions.find((opt) => opt.value === sort)?.label ?? "Sort"}</span>
									<ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${sortOpen ? "rotate-180" : ""}`} />
								</button>
								{sortOpen && (
									<div className="absolute right-0 top-full z-20 mt-2 min-w-[200px] origin-top-right overflow-hidden rounded-2xl border border-[var(--pp-border)] bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200">
										{sortOptions.map((option) => (
											<button
												key={option.value}
												className={`w-full rounded-xl px-4 py-2.5 text-left text-xs font-medium transition-colors ${sort === option.value
													? "bg-[var(--pp-gold)] text-[var(--pp-ink)]"
													: "text-[var(--pp-muted)] hover:bg-[var(--pp-beige)]/40 hover:text-[var(--pp-ink)]"
													}`}
												onClick={() => {
													setSort(option.value);
													setSortOpen(false);
												}}
											>
												{option.label}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{filtersOpen && (
						<div className="fixed inset-0 z-50 lg:hidden">
							<button
								className="absolute inset-0 bg-black/40"
								onClick={() => setFiltersOpen(false)}
								aria-label="Close filters"
							/>
							<div className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-[32px] bg-white shadow-2xl animate-in slide-in-from-bottom duration-300">
								<div className="flex items-center justify-between border-b border-[var(--pp-border)] p-6">
									<h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--pp-ink)]">Filters</h3>
									<button
										className="rounded-full bg-[var(--pp-beige)]/50 p-2 text-[var(--pp-ink)] transition-colors hover:bg-[var(--pp-beige)]"
										onClick={() => setFiltersOpen(false)}
									>
										<X className="h-4 w-4" />
									</button>
								</div>
								<div className="flex-1 overflow-y-auto p-6">
									<div className="space-y-8">
										<div className="space-y-3">
											<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
												Category
											</p>
											<div className="flex flex-wrap gap-2">
												<button
													className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${!category
														? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)] shadow-sm"
														: "border-[var(--pp-border)] bg-white text-[var(--pp-muted)]"
														}`}
													onClick={() => {
														setCategory("");
														trackEvent("filter_used", { type: "category", value: "all" });
													}}
												>
													All
												</button>
												{categories.map((item) => (
													<button
														key={item.id}
														className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${category === item.slug
															? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)] shadow-sm"
															: "border-[var(--pp-border)] bg-white text-[var(--pp-muted)]"
															}`}
														onClick={() => {
															setCategory(item.slug);
															trackEvent("filter_used", { type: "category", value: item.slug });
														}}
													>
														{item.name}
													</button>
												))}
											</div>
										</div>
										<div className="space-y-3">
											<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
												Price Range
											</p>
											<div className="flex flex-wrap gap-2">
												{[199, 299, 499].map((value) => (
													<button
														key={value}
														className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${priceRange[1] === value
															? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)] shadow-sm"
															: "border-[var(--pp-border)] bg-white text-[var(--pp-muted)]"
															}`}
														onClick={() => {
															setPriceRange([0, value]);
															trackEvent("filter_used", { type: "price", value });
														}}
													>
														Under ₹{value}
													</button>
												))}
											</div>
										</div>
										{/* Material Filter hidden for now */}
										{/* <div className="space-y-3">
										<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
											Material
										</p>
										<div className="flex flex-wrap gap-2">
											{MATERIALS.map((item) => (
												<button
													key={item}
													className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${material === item
														? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)] shadow-sm"
														: "border-[var(--pp-border)] bg-white text-[var(--pp-muted)]"
														}`}
													onClick={() => {
														setMaterial(item);
														trackEvent("filter_used", { type: "material", value: item });
													}}
												>
													{item}
												</button>
											))}
										</div>
									</div> */}
									</div>
								</div>
								<div className="border-t border-[var(--pp-border)] bg-[var(--pp-beige)]/20 p-6">
									<div className="flex items-center gap-4">
										<button
											className="flex-1 rounded-2xl border border-[var(--pp-border)] bg-white py-4 text-xs font-bold uppercase tracking-widest text-[var(--pp-ink)] transition-colors active:bg-[var(--pp-beige)]/40"
											onClick={clearFilters}
										>
											Clear All
										</button>
										<button
											className="flex-1 rounded-2xl bg-[var(--pp-ink)] py-4 text-xs font-bold uppercase tracking-widest text-white transition-opacity active:opacity-90"
											onClick={() => setFiltersOpen(false)}
										>
											Apply
										</button>
									</div>
								</div>
							</div>
						</div>
					)}

					{activeFilters.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{activeFilters.map((item) => (
								<button
									key={item.label}
									onClick={item.onRemove}
									className="flex items-center gap-2 rounded-full border border-[var(--pp-border)] bg-[var(--pp-beige)]/70 px-3 py-1 text-xs"
								>
									{item.label}
									<span className="text-[10px]">×</span>
								</button>
							))}
							<button className="text-xs font-semibold text-[var(--pp-ink)] underline underline-offset-4" onClick={clearFilters}>
								Clear all
							</button>
						</div>
					)}

					{filtered.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-[var(--pp-border)] bg-[var(--pp-beige)]/10 px-6 py-24 text-center">
							<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
								<Search className="h-6 w-6 text-[var(--pp-muted)]" />
							</div>
							<h3 className="text-lg font-semibold text-[var(--pp-ink)]">No pieces found</h3>
							<p className="mt-2 max-w-xs text-sm text-[var(--pp-muted)]">
								We couldn&apos;t find anything matching your filters. Try resetting them to explore our full collection.
							</p>
							<button
								className="mt-8 rounded-full bg-[var(--pp-ink)] px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
								onClick={clearFilters}
							>
								Reset All Filters
							</button>
						</div>
					) : (
						<>
							<div key={`${category}-${query}-${priceRange[1]}-${material}`} className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 md:hidden">
								{visibleItems.map((product, idx) => (
									<ProductCard key={product.id} product={product} index={idx} size="compact" isLaunchMode={isLaunchMode} />
								))}
							</div>
							<div key={`grid-${category}-${query}-${priceRange[1]}-${material}`} className="hidden animate-in fade-in slide-in-from-bottom-4 duration-700 md:block">
								<ProductGrid products={visibleItems} size="compact" isLaunchMode={isLaunchMode} />
							</div>
							{visible < filtered.length && (
								<div className="flex justify-center">
									<button
										className="btn-outline text-sm"
										onClick={() => {
											setVisible((prev) => prev + 8);
											trackEvent("load_more_products", { visible: visible + 8 });
										}}
									>
										Load more
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</>
	);
}

"use client";

import { memo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GripVertical, Power, PowerOff, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ProductImage } from "@/types/catalog";
import AdminTableShell from "@/components/admin/admin-table-shell";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import { highlightText } from "@/lib/highlight";
import AdminMediaViewer from "@/components/admin/admin-media-viewer";

interface ProductRow {
	id: string;
	name: string;
	price: number;
	stock: number;
	isActive: boolean;
	categoryName?: string | null;
	image?: ProductImage | null;
	createdAt: string;
	updatedAt: string;
}

interface AdminProductsTableProps {
	products: ProductRow[];
	page: number;
	pageSize: number;
	total: number;
	query: string;
	sort: string[];
	dir: Array<"asc" | "desc">;
	onSort: (key: string) => void;
	onPageChange: (nextPage: number) => void;
	onToggleActive: (product: ProductRow) => void;
	selectedIds: Set<string>;
	onToggleSelect: (id: string, checked: boolean) => void;
	onToggleSelectAll: (checked: boolean) => void;
	onDelete: (id: string) => void;
	isLoading?: boolean;
	footerSlot?: React.ReactNode;
	onReorder?: (nextProducts: ProductRow[]) => void;
	isReordering?: boolean;
}

function AdminProductsTable({
	products,
	page,
	pageSize,
	total,
	query,
	sort,
	dir,
	onSort,
	onPageChange,
	onToggleActive,
	selectedIds,
	onToggleSelect,
	onToggleSelectAll,
	onDelete,
	isLoading = false,
	footerSlot,
	onReorder,
	isReordering = false,
}: AdminProductsTableProps) {
	const [previewItem, setPreviewItem] = useState<{ url: string; title?: string | null } | null>(null);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	const canReorder = !query && sort.length === 1 && sort[0] === "priority" && dir[0] === "asc";

	const handleDragStart = (index: number) => {
		if (!canReorder) return;
		setDraggedIndex(index);
	};

	const handleDragOver = (event: React.DragEvent, index: number) => {
		if (!canReorder || draggedIndex === null || draggedIndex === index) return;
		event.preventDefault();

		const nextProducts = [...products];
		const item = nextProducts.splice(draggedIndex, 1)[0];
		nextProducts.splice(index, 0, item);

		setDraggedIndex(index);
		if (onReorder) onReorder(nextProducts);
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
	};
	const getDirFor = (key: string) => {
		const index = sort.indexOf(key);
		return index >= 0 ? dir[index] ?? "desc" : undefined;
	};
	const getSortRank = (key: string) => {
		const index = sort.indexOf(key);
		return index >= 0 ? index + 1 : null;
	};
	const allSelected = products.length > 0 && products.every((product) => selectedIds.has(product.id));
	const showSkeleton = isLoading && products.length === 0;
	const skeletonRows = Array.from({ length: Math.min(6, pageSize) }, (_, index) => index);

	return (
		<>
			<AdminTableShell
			page={page}
			pageSize={pageSize}
			total={total}
			onPageChange={onPageChange}
			isLoading={isLoading}
			footerSlot={footerSlot}
		>
			<table className="admin-table w-full text-left text-sm">
				<thead className="border-b border-[var(--pp-border)] bg-white/70 text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
					<tr>
						<th className="w-16 px-5 py-4">
							<button
								type="button"
								onClick={() => onSort("priority")}
								className={`inline-flex items-center gap-1 cursor-pointer transition-colors ${sort[0] === "priority" && dir[0] === "asc" ? "text-[var(--pp-gold)]" : "hover:text-[var(--pp-ink)]"}`}
								title="Sort by custom order to enable dragging"
							>
								Order
								{getDirFor("priority") && (
									<span className="text-[10px]">
										{getDirFor("priority") === "asc" ? "↑" : "↓"}
									</span>
								)}
							</button>
						</th>
						<th className="px-5 py-4">
							<input
								type="checkbox"
								aria-label="Select all products"
								checked={allSelected}
								onChange={(event) => onToggleSelectAll(event.target.checked)}
							/>
						</th>
						<th className="px-5 py-4">
							<button
								type="button"
								onClick={() => onSort("name")}
								className="inline-flex items-center gap-2 cursor-pointer"
							>
								Product
								{getDirFor("name") && (
									<span className="text-[10px]">
										{getDirFor("name") === "asc" ? "↑" : "↓"}
										{getSortRank("name")}
									</span>
								)}
							</button>
						</th>
						<th className="px-5 py-4">
							<button
								type="button"
								onClick={() => onSort("category")}
								className="inline-flex items-center gap-2 cursor-pointer"
							>
								Category
								{getDirFor("category") && (
									<span className="text-[10px]">
										{getDirFor("category") === "asc" ? "↑" : "↓"}
										{getSortRank("category")}
									</span>
								)}
							</button>
						</th>
						<th className="px-5 py-4">
							<button
								type="button"
								onClick={() => onSort("price")}
								className="inline-flex items-center gap-2 cursor-pointer"
							>
								Price
								{getDirFor("price") && (
									<span className="text-[10px]">
										{getDirFor("price") === "asc" ? "↑" : "↓"}
										{getSortRank("price")}
									</span>
								)}
							</button>
						</th>
						<th className="px-5 py-4">
							<button
								type="button"
								onClick={() => onSort("stock")}
								className="inline-flex items-center gap-2 cursor-pointer"
							>
								Stock
								{getDirFor("stock") && (
									<span className="text-[10px]">
										{getDirFor("stock") === "asc" ? "↑" : "↓"}
										{getSortRank("stock")}
									</span>
								)}
							</button>
						</th>
						<th className="px-5 py-4">
							<button
								type="button"
								onClick={() => onSort("status")}
								className="inline-flex items-center gap-2 cursor-pointer"
							>
								Status
								{getDirFor("status") && (
									<span className="text-[10px]">
										{getDirFor("status") === "asc" ? "↑" : "↓"}
										{getSortRank("status")}
									</span>
								)}
							</button>
						</th>
						<th className="px-5 py-4">
							<button
								type="button"
								onClick={() => onSort("updatedAt")}
								className="inline-flex items-center gap-2 cursor-pointer"
							>
								Updated
								{getDirFor("updatedAt") && (
									<span className="text-[10px]">
										{getDirFor("updatedAt") === "asc" ? "↑" : "↓"}
										{getSortRank("updatedAt")}
									</span>
								)}
							</button>
						</th>
						<th className="px-5 py-4 text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{showSkeleton ? (
						skeletonRows.map((row) => (
							<tr key={`skeleton-${row}`} className="border-b border-[var(--pp-border)] last:border-b-0">
								<td className="px-5 py-4">
									<div className="h-4 w-4 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
								</td>
								<td className="px-5 py-4">
									<div className="flex items-center gap-3">
										<div className="h-14 w-12 rounded-sm bg-[var(--pp-beige)]/70 animate-pulse" />
										<div className="space-y-2">
											<div className="h-3 w-32 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
											<div className="h-2 w-16 rounded bg-[var(--pp-beige)]/50 animate-pulse" />
										</div>
									</div>
								</td>
								<td className="px-5 py-4">
									<div className="h-3 w-24 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
								</td>
								<td className="px-5 py-4">
									<div className="h-3 w-16 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
								</td>
								<td className="px-5 py-4">
									<div className="h-3 w-10 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
								</td>
								<td className="px-5 py-4">
									<div className="h-5 w-20 rounded-full bg-[var(--pp-beige)]/70 animate-pulse" />
								</td>
								<td className="px-5 py-4">
									<div className="h-3 w-20 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
								</td>
								<td className="px-5 py-4">
									<div className="flex justify-end gap-2">
										<div className="h-9 w-9 rounded-full bg-[var(--pp-beige)]/70 animate-pulse" />
										<div className="h-9 w-9 rounded-full bg-[var(--pp-beige)]/70 animate-pulse" />
										<div className="h-9 w-9 rounded-full bg-[var(--pp-beige)]/70 animate-pulse" />
									</div>
								</td>
							</tr>
						))
					) : products.length === 0 ? (
						<AdminEmptyState colSpan={8} message="No products found." />
					) : (
						products.map((product, index) => {
							const isActive = product.isActive;
							return (
								<tr
									key={product.id}
									draggable={canReorder}
									onDragStart={() => handleDragStart(index)}
									onDragOver={(e) => handleDragOver(e, index)}
									onDragEnd={handleDragEnd}
									className={`border-b border-[var(--pp-border)] last:border-b-0 transition-colors ${
										draggedIndex === index ? "bg-[var(--pp-beige)]/30 opacity-50" : ""
									} ${canReorder ? "cursor-grab active:cursor-grabbing" : ""}`}
								>
									<td className="w-16 px-5 py-4 text-[var(--pp-muted)]">
										<div
											className={`inline-flex items-center justify-center p-1 rounded transition-colors ${
												canReorder ? "text-[var(--pp-ink)] hover:bg-[var(--pp-beige)]" : "opacity-30 cursor-not-allowed"
											}`}
											title={canReorder ? "Drag to reorder" : "Sort by 'Order' ascending to enable dragging"}
										>
											<GripVertical className="h-4 w-4" />
										</div>
									</td>
									<td className="px-5 py-4" data-label="Select">
										<input
											type="checkbox"
											aria-label={`Select ${product.name}`}
											checked={selectedIds.has(product.id)}
											onChange={(event) => onToggleSelect(product.id, event.target.checked)}
										/>
									</td>
									<td className="admin-table-main px-5 py-4" data-label="Product">
										<div className="flex items-center gap-3">
											<div className="relative h-14 w-12 overflow-hidden rounded-sm bg-[var(--pp-beige)] cursor-pointer">
												{product.image?.url && (
													<>
														<Image
															src={product.image.url}
															alt={product.name}
															fill
															sizes="48px"
															className="object-cover"
														/>
														<button
															type="button"
															className="absolute inset-0 z-10 cursor-pointer"
															onClick={() =>
																setPreviewItem({ url: product.image?.url ?? "", title: product.name })
															}
															aria-label={`Preview ${product.name}`}
														/>
													</>
												)}
											</div>
											<div>
												<p className="font-semibold text-[var(--pp-ink)]">
													{highlightText(product.name, query)}
												</p>
											</div>
										</div>
									</td>
									<td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Category">
										{product.categoryName ? highlightText(product.categoryName, query) : "—"}
									</td>
									<td className="px-5 py-4 font-medium" data-label="Price">
										{formatCurrency(product.price)}
									</td>
									<td className="px-5 py-4" data-label="Stock">
										{product.stock}
									</td>
									<td className="px-5 py-4" data-label="Status">
										<span
											className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
												isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
											}`}
										>
											{isActive ? "Active" : "Inactive"}
										</span>
									</td>
									<td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Updated">
										{new Date(product.updatedAt).toLocaleDateString("en-IN")}
									</td>
									<td className="admin-table-actions px-5 py-4" data-label="Actions">
										<div className="flex justify-end gap-2">
											<Link
												href={`/admin/products/${product.id}`}
												className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-[var(--pp-gold)] hover:bg-[var(--pp-beige)]"
												aria-label="Edit"
											>
												<Pencil className="h-4 w-4" />
													<span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:block group-hover:opacity-100">
														Edit
													</span>
											</Link>
											<button
												onClick={() => onDelete(product.id)}
												className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
												aria-label="Delete"
											>
												<Trash2 className="h-4 w-4" />
													<span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:block group-hover:opacity-100">
														Delete
													</span>
											</button>
											<button
												onClick={() => onToggleActive(product)}
												className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-[var(--pp-gold)] hover:bg-[var(--pp-beige)]"
												aria-label={isActive ? "Deactivate" : "Activate"}
											>
												{isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
												<span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:block group-hover:opacity-100">
													{isActive ? "Deactivate" : "Activate"}
												</span>
											</button>
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>
			</AdminTableShell>
			<AdminMediaViewer
				open={Boolean(previewItem)}
				item={previewItem ? { url: previewItem.url, title: previewItem.title ?? "Product image" } : null}
				onClose={() => setPreviewItem(null)}
			/>
		</>
	);
}

export default memo(AdminProductsTable);

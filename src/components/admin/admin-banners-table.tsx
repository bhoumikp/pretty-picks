"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import AdminTableShell from "@/components/admin/admin-table-shell";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminMediaViewer from "@/components/admin/admin-media-viewer";

interface BannerRow {
	id: string;
	eyebrow?: string | null;
	title: string;
	subtitle?: string | null;
	image: string;
	mobileImage?: string | null;
	link?: string | null;
	ctaLabel?: string | null;
	priority: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

interface AdminBannersTableProps {
	banners: BannerRow[];
	onEdit: (banner: BannerRow) => void;
	onDelete: (id: string) => void;
	onToggleActive: (banner: BannerRow) => void;
	isLoading?: boolean;
}

function AdminBannersTable({
	banners,
	onEdit,
	onDelete,
	onToggleActive,
	isLoading = false,
}: AdminBannersTableProps) {
	const [previewItem, setPreviewItem] = useState<{ url: string; title?: string | null } | null>(null);

	return (
		<>
			<AdminTableShell
				page={1}
				pageSize={banners.length}
				total={banners.length}
				onPageChange={() => {}}
				isLoading={isLoading}
				hidePagination
			>
				<table className="admin-table w-full text-left text-sm">
					<thead className="border-b border-[var(--pp-border)] bg-white/70 text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
						<tr>
							<th className="px-5 py-4">Priority</th>
							<th className="px-5 py-4">Banner</th>
							<th className="px-5 py-4">Image</th>
							<th className="px-5 py-4">Status</th>
							<th className="px-5 py-4 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{banners.length === 0 ? (
							<AdminEmptyState colSpan={5} message="No banners found." />
						) : (
							banners.map((banner) => (
								<tr key={banner.id} className="border-b border-[var(--pp-border)] last:border-b-0">
									<td className="px-5 py-4 font-mono text-sm tabular-nums text-[var(--pp-muted)]">
										{banner.priority}
									</td>
									<td className="admin-table-main px-5 py-4">
										<div>
											{banner.eyebrow && (
												<p className="text-[10px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">
													{banner.eyebrow}
												</p>
											)}
											<p className="font-semibold text-[var(--pp-ink)]">{banner.title}</p>
											{banner.subtitle && <p className="text-xs text-[var(--pp-muted)]">{banner.subtitle}</p>}
											{banner.ctaLabel && (
												<p className="mt-1 text-[11px] font-medium text-[var(--pp-gold)]">
													CTA: {banner.ctaLabel}
												</p>
											)}
										</div>
									</td>
									<td className="px-5 py-4">
										<div className="relative h-12 w-24 overflow-hidden rounded-sm bg-[var(--pp-beige)] cursor-pointer border border-[var(--pp-border)]">
											<Image
												src={banner.image}
												alt={banner.title}
												fill
												sizes="96px"
												className="object-cover"
											/>
											<button
												type="button"
												className="absolute inset-0 z-10 cursor-pointer"
												onClick={() => setPreviewItem({ url: banner.image, title: banner.title })}
												aria-label={`Preview ${banner.title}`}
											/>
										</div>
									</td>
									<td className="px-5 py-4">
										<span
											className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
												banner.isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
											}`}
										>
											{banner.isActive ? "Active" : "Inactive"}
										</span>
									</td>
									<td className="admin-table-actions px-5 py-4">
										<div className="flex justify-end gap-2">
											<button
												onClick={() => onEdit(banner)}
												className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-[var(--pp-gold)] hover:bg-[var(--pp-beige)]"
												aria-label="Edit"
											>
												<Pencil className="h-4 w-4" />
											</button>
											<button
												onClick={() => onToggleActive(banner)}
												className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-[var(--pp-gold)] hover:bg-[var(--pp-beige)]"
												aria-label={banner.isActive ? "Deactivate" : "Activate"}
											>
												{banner.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
											</button>
											<button
												onClick={() => onDelete(banner.id)}
												className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
												aria-label="Delete"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</AdminTableShell>
			<AdminMediaViewer
				open={Boolean(previewItem)}
				item={previewItem ? { url: previewItem.url, title: previewItem.title ?? "Banner image" } : null}
				onClose={() => setPreviewItem(null)}
			/>
		</>
	);
}

export default memo(AdminBannersTable);

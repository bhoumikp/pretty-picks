"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import AdminBannersTable from "./admin-banners-table";
import ToastStack from "@/components/ui/toast-stack";

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

interface AdminBannersProps {
	initialBanners: BannerRow[];
}

export default function AdminBanners({ initialBanners }: AdminBannersProps) {
	const router = useRouter();
	const [banners, setBanners] = useState(initialBanners);
	const [loading, setLoading] = useState(false);
	const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: "success" | "error" }>>([]);

	const fetchBanners = useCallback(async () => {
		setLoading(true);
		const response = await fetch("/api/admin/banners", { cache: "no-store" });
		if (response.ok) {
			const data = (await response.json()) as BannerRow[];
			setBanners(data);
		}
		setLoading(false);
	}, []);

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this banner?")) return;
		const response = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
		if (response.ok) {
			setToasts((prev) => [...prev, { id: Date.now().toString(), message: "Banner deleted successfully", type: "success" }]);
			fetchBanners();
		} else {
			setToasts((prev) => [...prev, { id: Date.now().toString(), message: "Failed to delete banner", type: "error" }]);
		}
	};

	const handleToggleActive = async (banner: BannerRow) => {
		const response = await fetch(`/api/admin/banners/${banner.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isActive: !banner.isActive }),
		});
		if (response.ok) {
			fetchBanners();
		}
	};

	return (
		<div className="grid gap-6">
			<ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))} />
			<div className="flex items-center justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Storefront</p>
					<div className="flex items-center gap-2">
						<h2 className="text-2xl font-[var(--font-heading)]">Hero Banners</h2>
						<button
							onClick={fetchBanners}
							disabled={loading}
							className="rounded-md p-1.5 text-[var(--pp-muted)] transition hover:bg-[var(--pp-beige)] hover:text-[var(--pp-ink)]"
						>
							<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[var(--pp-gold)]" : ""}`} />
						</button>
					</div>
				</div>
				<button onClick={() => router.push("/admin/banners/new")} className="btn-primary admin-btn admin-btn-size px-6">
					<Plus className="mr-2 h-4 w-4" />
					<span className="admin-btn-label">Add Banner</span>
				</button>
			</div>

			<AdminBannersTable
				banners={banners}
				onEdit={(banner) => router.push(`/admin/banners/${banner.id}`)}
				onDelete={handleDelete}
				onToggleActive={handleToggleActive}
				isLoading={loading}
			/>
		</div>
	);
}

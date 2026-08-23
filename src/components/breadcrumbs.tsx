import Link from "next/link";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
	return (
		<nav aria-label="Breadcrumb" className="text-[10px] uppercase tracking-[0.2em] text-[var(--pp-muted)] md:text-xs">
			<ol className="flex flex-wrap items-center gap-3">
				{items.map((item, index) => (
					<li key={`${item.label}-${index}`} className="flex items-center gap-3">
						{item.href ? (
							<Link href={item.href} className="transition hover:text-[var(--pp-gold)]">
								{item.label}
							</Link>
						) : (
							<span className="text-[var(--pp-ink)]">{item.label}</span>
						)}
						{index < items.length - 1 && <span className="text-[var(--pp-border)]">/</span>}
					</li>
				))}
			</ol>
		</nav>
	);
}

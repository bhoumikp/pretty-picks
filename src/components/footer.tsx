import Link from "next/link";
import { navigation, siteConfig } from "@/data/site";

export default function Footer() {
	const categoryLinks = navigation.filter((item) => item.href.startsWith("/category/"));

	return (
		<footer className="border-t border-white/10 bg-[var(--pp-ink)] text-white">
			<div className="page-shell grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
				<div>
					<h3 className="font-[var(--font-heading)] text-2xl text-white">
						{siteConfig.name}
					</h3>
					<p className="mt-3 text-sm text-white/70">
						Affordable artificial jewellery curated for Instagram-ready moments.
					</p>
					<div className="mt-4 text-sm text-white/70">
						<p>Contact-first ordering</p>
						<p className="mt-2">Email: {siteConfig.supportEmail}</p>
					</div>
				</div>
				<div>
					<h4 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
						Explore
					</h4>
					<ul className="mt-4 space-y-2 text-sm text-white/70">
						{navigation.slice(0, 6).map((item) => (
							<li key={item.href}>
								<Link href={item.href} className="transition hover:text-[var(--pp-gold)]">
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
				<div>
					<h4 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
						Categories
					</h4>
					<ul className="mt-4 space-y-2 text-sm text-white/70">
						{categoryLinks.map((item) => (
							<li key={item.href}>
								<Link href={item.href} className="transition hover:text-[var(--pp-gold)]">
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
				<div>
					<h4 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
						Newsletter
					</h4>
					<p className="mt-4 text-sm text-white/70">
						Get drops, styling tips, and exclusive offers.
					</p>
					<form className="mt-4 flex gap-2">
						<input
							placeholder="Your email"
							className="w-full rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50"
						/>
						<button className="btn-primary text-xs">Join</button>
					</form>
					<a
						href={siteConfig.instagramUrl}
						target="_blank"
						rel="noreferrer"
						className="mt-4 inline-flex text-sm font-semibold text-[var(--pp-gold)]"
					>
						Instagram →
					</a>
				</div>
			</div>
			<div className="border-t border-white/10 py-4 text-xs text-white/60">
				<div className="page-shell flex flex-col items-center justify-between gap-2 md:flex-row">
					<span>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</span>
					<a
						href={siteConfig.developerGithub}
						target="_blank"
						rel="noreferrer"
						className="transition duration-300 hover:underline hover:underline-offset-4 hover:decoration-[var(--pp-gold)]"
					>
						Developed by Bhaumik P.
					</a>
					<span>Made in India with ❤️</span>
				</div>
			</div>
		</footer>
	);
}

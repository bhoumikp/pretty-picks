import Link from "next/link";
import { navigation, siteConfig } from "@/data/site";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--pp-border)] bg-white">
      <div className="page-shell grid gap-10 py-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <h3 className="font-[var(--font-heading)] text-2xl">{siteConfig.name}</h3>
          <p className="mt-3 text-sm text-[var(--pp-muted)]">
            Affordable artificial jewellery curated for Instagram-ready moments.
          </p>
          <div className="mt-4 text-sm text-[var(--pp-muted)]">
            <p>WhatsApp-first ordering</p>
            <p className="mt-2">Email: {siteConfig.supportEmail}</p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--pp-muted)]">
            Explore
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            {navigation.slice(0, 6).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-[var(--pp-gold)]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--pp-muted)]">
            Categories
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            {navigation.slice(2, 6).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-[var(--pp-gold)]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--pp-muted)]">
            Newsletter
          </h4>
          <p className="mt-4 text-sm text-[var(--pp-muted)]">
            Get drops, styling tips, and exclusive offers.
          </p>
          <form className="mt-4 flex gap-2">
            <input
              placeholder="Your email"
              className="w-full rounded-xl border border-[var(--pp-border)] px-3 py-2 text-sm"
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
      <div className="border-t border-[var(--pp-border)] py-4 text-center text-xs text-[var(--pp-muted)]">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}

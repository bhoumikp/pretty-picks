import { siteConfig } from "@/data/site";

export const metadata = {
  title: "About",
  description: "Learn about the Pretty Picks brand story.",
};

export default function AboutPage() {
  return (
    <div className="page-shell section-pad">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="eyebrow">About</p>
          <h1 className="section-title mt-2">Our story</h1>
          <p className="mt-6 text-sm leading-7 text-[var(--pp-muted)]">
            Pretty Picks was born out of late-night Instagram scrolls and the wish to
            make jewellery accessible without compromising on style. We curate
            affordable artificial jewellery that feels effortless, feminine, and
            ready for every reel-worthy moment.
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--pp-muted)]">
            Every piece is picked to match Indian styling sensibilities, from soft
            gold hues to playful silhouettes. Order directly on WhatsApp and get a
            personalized experience.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-xs"
            >
              Follow us on Instagram
            </a>
            <a href="/contact" className="btn-outline text-xs">
              Contact Us
            </a>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--pp-border)] bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Why Pretty Picks</h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--pp-muted)]">
            <li>Curated designs that photograph beautifully.</li>
            <li>Budget-friendly, premium-looking finishes.</li>
            <li>Fast response, WhatsApp-first ordering.</li>
            <li>Trusted by Instagram-first shoppers in India.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

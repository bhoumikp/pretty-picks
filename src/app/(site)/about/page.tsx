import { siteConfig } from "@/data/site";

export const metadata = {
  title: "About",
  description: "Learn about the Pretty Picks brand story.",
};

export default function AboutPage() {
  return (
    <div className="page-shell section-pad max-w-4xl">
      <p className="section-kicker">About</p>
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
      <a
        href={siteConfig.instagramUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex rounded-full border border-[var(--pp-border)] px-6 py-3 text-sm font-semibold"
      >
        Follow us on Instagram
      </a>
    </div>
  );
}

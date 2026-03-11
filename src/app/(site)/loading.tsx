import { SkeletonGrid } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <section className="section-pad">
        <div className="page-shell">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <p className="eyebrow">Pretty Picks</p>
              <h1 className="font-[var(--font-heading)] text-4xl font-medium tracking-tight text-[var(--pp-ink)] sm:text-5xl">
                Everyday sparkle, styled for reels.
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-[var(--pp-muted)]">
                Premium-looking artificial jewellery designed for Instagram-first style.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="h-10 w-36 rounded-full bg-[var(--pp-beige)]" />
                <div className="h-10 w-32 rounded-full bg-[var(--pp-beige)]" />
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-xs">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-9 w-28 rounded-full border border-[var(--pp-border)] bg-white/80"
                  />
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative h-[360px] overflow-hidden rounded-[28px] bg-[var(--pp-beige)] shadow-sm sm:h-[420px] lg:h-[520px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-shell">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">Featured</p>
              <h2 className="section-title">Trending right now</h2>
            </div>
            <div className="h-4 w-24 rounded-full bg-[var(--pp-beige)]" />
          </div>
          <div className="rounded-[28px] bg-[var(--pp-beige)]/70 p-6 md:p-8">
            <SkeletonGrid count={4} />
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-shell">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="eyebrow">Categories</p>
              <h2 className="section-title">Shop by vibe</h2>
            </div>
            <div className="h-4 w-24 rounded-full bg-[var(--pp-beige)]" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[var(--pp-border)] bg-white p-4"
              >
                <div className="aspect-square rounded-2xl bg-[var(--pp-beige)]" />
                <div className="mt-4 h-4 w-24 rounded-full bg-[var(--pp-beige)]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

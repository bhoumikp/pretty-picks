import { SkeletonGrid } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="page-shell section-pad">
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--pp-border)] bg-white p-6 pt-4 shadow-sm sm:p-8 sm:pt-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Products</p>
          <h1 className="section-title">Browse all</h1>
          <p className="mt-3 text-sm text-[var(--pp-muted)] sm:text-base">
            Discover curated pieces crafted for effortless styling.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--pp-muted)]">
            {["Contact-first ordering", "Under ₹199 picks", "Fast dispatch"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--pp-border)] bg-[var(--pp-beige)]/60 px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-20 h-40 w-40 rounded-full bg-[var(--pp-beige)]/70" />
      </div>
      <div className="mt-10">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-36">
              <div className="rounded-3xl border border-[var(--pp-border)] bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Filters</h3>
                <div className="mt-5 space-y-5 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                      Category
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["All", "Earrings", "Necklaces", "Rings", "Bangles"].map((item) => (
                        <button
                          key={item}
                          disabled
                          className="cursor-not-allowed rounded-full border border-[var(--pp-border)] px-3 py-1 text-[var(--pp-muted)] opacity-70"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                      Price
                    </p>
                    <div className="mt-2 flex gap-2">
                      {[199, 299, 499].map((value) => (
                        <button
                          key={value}
                          disabled
                          className="cursor-not-allowed rounded-full border border-[var(--pp-border)] px-3 py-1 text-[var(--pp-muted)] opacity-70"
                        >
                          Under ₹{value}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                      Material
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["Alloy", "Enamel", "Faux Pearl", "Anti-tarnish"].map((item) => (
                        <button
                          key={item}
                          disabled
                          className="cursor-not-allowed rounded-full border border-[var(--pp-border)] px-3 py-1 text-[var(--pp-muted)] opacity-70"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          <div className="space-y-7">
            <div className="flex flex-col gap-4 border-b border-[var(--pp-border)] pb-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  disabled
                  placeholder="Search products"
                  className="w-full rounded-full border border-[var(--pp-border)] bg-white/70 px-4 py-2 text-sm text-[var(--pp-muted)] shadow-sm sm:w-64"
                />
                <button
                  disabled
                  className="cursor-not-allowed rounded-full border border-[var(--pp-border)] px-4 py-2 text-xs text-[var(--pp-muted)]"
                >
                  Filters
                </button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-xs text-[var(--pp-muted)]">Showing 0 of 0</p>
                <button
                  disabled
                  className="flex w-full items-center justify-between gap-2 rounded-full border border-[var(--pp-border)] bg-white/70 px-4 py-2 text-sm text-[var(--pp-muted)] shadow-sm sm:min-w-[220px]"
                >
                  Sort ▾
                </button>
              </div>
            </div>
            <SkeletonGrid />
          </div>
        </div>
      </div>
    </div>
  );
}

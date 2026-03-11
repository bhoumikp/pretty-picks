export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--pp-border)] bg-white shadow-sm">
      <div className="aspect-[3/2] w-full rounded-t-2xl bg-[var(--pp-beige)]" />
      <div className="space-y-3 px-4 py-4">
        <div className="h-3 w-20 rounded-full bg-[var(--pp-beige)]" />
        <div className="h-4 w-40 rounded-full bg-[var(--pp-beige)]" />
        <div className="h-3 w-24 rounded-full bg-[var(--pp-beige)]" />
      </div>
      <div className="border-t border-[var(--pp-border)] px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="h-7 w-24 rounded-full bg-[var(--pp-beige)]" />
          <div className="h-8 w-24 rounded-full bg-[var(--pp-beige)]" />
        </div>
        <div className="mt-3 h-9 w-full rounded-full bg-[var(--pp-beige)]" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, className = "" }: { count?: number; className?: string } = {}) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

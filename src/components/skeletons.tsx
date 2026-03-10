export function SkeletonCard() {
  return (
    <div className="soft-card animate-pulse rounded-3xl">
      <div className="h-48 w-full rounded-t-3xl bg-[var(--pp-beige)]" />
      <div className="space-y-3 px-4 py-4">
        <div className="h-3 w-20 rounded-full bg-[var(--pp-beige)]" />
        <div className="h-4 w-40 rounded-full bg-[var(--pp-beige)]" />
        <div className="h-3 w-24 rounded-full bg-[var(--pp-beige)]" />
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

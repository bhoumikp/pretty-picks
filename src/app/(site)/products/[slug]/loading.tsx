export default function Loading() {
  return (
    <div className="page-shell section-pad">
      <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="aspect-square animate-pulse rounded-3xl bg-[var(--pp-beige)]" />
        <div className="space-y-4">
          <div className="h-3 w-24 rounded-full bg-[var(--pp-beige)]" />
          <div className="h-6 w-48 rounded-full bg-[var(--pp-beige)]" />
          <div className="h-4 w-32 rounded-full bg-[var(--pp-beige)]" />
          <div className="h-24 w-full rounded-2xl bg-[var(--pp-beige)]" />
        </div>
      </div>
    </div>
  );
}

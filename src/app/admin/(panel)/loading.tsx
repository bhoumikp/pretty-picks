export default function AdminPanelLoading() {
  return (
    <div className="grid gap-6">
      <div>
        <div className="h-3 w-32 animate-pulse rounded bg-[var(--pp-beige)]" />
        <div className="mt-3 h-7 w-48 animate-pulse rounded bg-[var(--pp-beige)]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="soft-card p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--pp-beige)]" />
            <div className="mt-4 h-8 w-20 animate-pulse rounded bg-[var(--pp-beige)]" />
          </div>
        ))}
      </div>
      <div className="soft-card p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-[var(--pp-beige)]" />
        <div className="mt-4 grid gap-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-12 w-full animate-pulse rounded bg-[var(--pp-beige)]" />
          ))}
        </div>
      </div>
    </div>
  );
}

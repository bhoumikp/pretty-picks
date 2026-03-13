"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--pp-beige)]">
      <div className="rounded-2xl bg-white p-10 text-center shadow">
        <h2 className="text-2xl font-[var(--font-heading)]">Something went wrong</h2>
        <p className="mt-3 text-sm text-[var(--pp-muted)]">{error.message}</p>
        <button
          onClick={() => reset()}
          className="mt-6 rounded-full bg-[var(--pp-gold)] px-5 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

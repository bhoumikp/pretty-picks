import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--pp-beige)] px-4">
      <div className="rounded-3xl bg-white p-10 text-center shadow">
        <h2 className="text-2xl font-[var(--font-heading)]">Page not found</h2>
        <p className="mt-3 text-sm text-[var(--pp-muted)]">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[var(--pp-gold)] px-5 py-3 text-sm font-semibold text-white"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}

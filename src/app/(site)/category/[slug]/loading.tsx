import { SkeletonGrid } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="page-shell section-pad">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Category</p>
          <h1 className="section-title">Collection</h1>
          <p className="mt-2 text-sm text-[var(--pp-muted)]">
            Loading curated pieces...
          </p>
        </div>
        <div className="hidden h-4 w-24 rounded-full bg-[var(--pp-beige)] sm:block" />
      </div>
      <div className="mt-8">
        <SkeletonGrid />
      </div>
    </div>
  );
}

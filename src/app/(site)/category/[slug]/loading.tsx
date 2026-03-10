import { SkeletonGrid } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
      <SkeletonGrid />
    </div>
  );
}

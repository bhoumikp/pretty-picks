import { SkeletonGrid } from "@/components/skeletons";

export default function Loading() {
	return (
		<div className="page-shell section-pad">
			<SkeletonGrid />
		</div>
	);
}

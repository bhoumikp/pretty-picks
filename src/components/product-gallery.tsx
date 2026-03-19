"use client";

import Image from "next/image";
import { useMemo, useState, type TouchEvent } from "react";
import { normalizeImages } from "@/lib/images";

interface ProductGalleryProps {
	images: unknown;
	name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
	const normalized = useMemo(() => normalizeImages(images), [images]);
	const [activeIndex, setActiveIndex] = useState(0);
	const [touchStart, setTouchStart] = useState<number | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const active = normalized[activeIndex] ?? normalized[0];

	const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
		setTouchStart(event.touches[0]?.clientX ?? null);
	};

	const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
		if (touchStart === null) return;
		const endX = event.changedTouches[0]?.clientX ?? touchStart;
		const delta = touchStart - endX;
		if (Math.abs(delta) > 40) {
			setActiveIndex((prev) => {
				if (delta > 0) {
					return Math.min(prev + 1, normalized.length - 1);
				}
				return Math.max(prev - 1, 0);
			});
		}
		setTouchStart(null);
	};

	const togglePreview = () => {
		if (window.innerWidth < 1024) {
			setShowPreview(!showPreview);
			if (!showPreview) {
				document.body.style.overflow = "hidden";
			} else {
				document.body.style.overflow = "";
			}
		}
	};

	if (!active) return null;

	return (
		<div className="space-y-4">
			<div
				className="group relative mx-auto aspect-[4/5] w-full max-w-[85vw] cursor-zoom-in overflow-hidden rounded-3xl border border-[var(--pp-border)] bg-white shadow-sm md:mx-0 md:aspect-[4/5] md:max-w-none h-auto max-h-[35vh] sm:max-h-[45vh] md:max-h-[55vh] lg:max-h-[65vh]"
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				onClick={togglePreview}
			>
				<Image
					src={active.url}
					alt={name}
					fill
					className="object-cover transition-transform duration-300 group-hover:scale-105"
					priority
				/>
			</div>
			<div className="flex gap-2 overflow-x-auto md:grid md:grid-cols-5 md:gap-3 md:overflow-visible">
				{normalized.slice(0, 5).map((image, index) => (
					<button
						key={`${image.url}-${index}`}
						onClick={() => setActiveIndex(index)}
						className={`relative aspect-square w-16 flex-none overflow-hidden rounded-xl border bg-[var(--pp-beige)] md:w-auto ${
							index === activeIndex ? "border-[var(--pp-ink)]" : "border-[var(--pp-border)]"
						}`}
					>
						<Image src={image.url} alt={name} fill className="object-cover" />
					</button>
				))}
			</div>

			{/* Mobile/Tablet Preview Model */}
			{showPreview && (
				<div 
					className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300"
					onClick={togglePreview}
				>
					<button 
						className="absolute top-6 right-6 z-[210] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md"
						onClick={togglePreview}
					>
						✕
					</button>
					<div className="relative h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl">
						<Image
							src={active.url}
							alt={name}
							fill
							className="object-contain"
							quality={100}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

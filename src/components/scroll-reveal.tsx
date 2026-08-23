"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
	children: React.ReactNode;
	animation?: "fade-up" | "fade-in" | "slide-left" | "slide-right" | "zoom-in" | "stagger";
	delay?: number;
	threshold?: number;
	className?: string;
}

export default function ScrollReveal({
	children,
	animation = "fade-up",
	delay = 0,
	threshold = 0.1,
	className = "",
}: ScrollRevealProps) {
	const [isVisible, setIsVisible] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.unobserve(entry.target);
				}
			},
			{ threshold }
		);

		if (ref.current) {
			observer.observe(ref.current);
		}

		return () => {
			if (ref.current) {
				observer.unobserve(ref.current);
			}
		};
	}, [threshold]);

	const animationClasses = {
		"fade-up": "translate-y-8 opacity-0",
		"fade-in": "opacity-0",
		"slide-left": "-translate-x-12 opacity-0",
		"slide-right": "translate-x-12 opacity-0",
		"zoom-in": "scale-95 opacity-0",
		"stagger": "translate-y-4 opacity-0",
	};

	const visibleClasses = {
		"fade-up": "translate-y-0 opacity-100",
		"fade-in": "opacity-100",
		"slide-left": "translate-x-0 opacity-100",
		"slide-right": "translate-x-0 opacity-100",
		"zoom-in": "scale-100 opacity-100",
		"stagger": "translate-y-0 opacity-100",
	};

	return (
		<div
			ref={ref}
			className={`transition-all duration-1000 ease-out ${className} ${
				isVisible ? visibleClasses[animation] : animationClasses[animation]
			}`}
			style={{ transitionDelay: `${delay}ms` }}
		>
			{children}
		</div>
	);
}

"use client";

import { useEffect, useState } from "react";
import { triggerCelebration } from "@/lib/celebration";

interface CountdownTimerProps {
	targetDate: string; // ISO format
	title?: string;
}

export default function CountdownTimer({
	targetDate,
	title = "Official Launching In",
}: CountdownTimerProps) {
	const [mounted, setMounted] = useState(false);
	const [hasCelebrated, setHasCelebrated] = useState(false);
	const [timeLeft, setTimeLeft] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	useEffect(() => {
		setMounted(true);
		const target = new Date(targetDate).getTime();

		const timer = setInterval(() => {
			const now = new Date().getTime();
			const distance = target - now;

			if (distance <= 0) {
				clearInterval(timer);
				if (!hasCelebrated) {
					triggerCelebration();
					setHasCelebrated(true);
					// Auto-disable showCountdown in the DB
					fetch("/api/launch/deactivate", { 
						method: "POST",
						headers: { "x-launch-token": "pp-launch-deactivate-2026" },
					})
						.catch(err => console.error("Auto-deactivation failed:", err));
				}
				return;
			}

			setTimeLeft({
				days: Math.floor(distance / (1000 * 60 * 60 * 24)),
				hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
				minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
				seconds: Math.floor((distance % (1000 * 60)) / 1000),
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [targetDate, hasCelebrated]);

	if (!mounted) {
		return (
			<section className="bg-[var(--pp-white)] py-20 text-center">
				<div className="mx-auto h-24 max-w-lg animate-pulse rounded-3xl bg-[var(--pp-beige)]/50" />
			</section>
		);
	}

	return (
		<div className="flex flex-col items-center text-center">
			<div className="flex gap-2 sm:gap-6 lg:gap-10 scale-[0.82] sm:scale-90 lg:scale-100 transition-transform origin-center">
				{[
					{ label: "Days", value: timeLeft.days },
					{ label: "Hours", value: timeLeft.hours },
					{ label: "Mins", value: timeLeft.minutes },
					{ label: "Secs", value: timeLeft.seconds },
				].map((item) => (
					<div key={item.label} className="group flex flex-col items-center">
						<div className="relative mb-2 flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--pp-border)] bg-white/50 shadow-sm transition-all group-hover:border-[var(--pp-gold)] group-hover:shadow-[0_10px_30px_rgba(198,162,106,0.15)] sm:h-24 sm:w-24 lg:h-28 lg:w-28">
							<span className="text-2xl font-light tracking-tighter text-[var(--pp-ink)] sm:text-4xl lg:text-5xl">
								{String(item.value).padStart(2, "0")}
							</span>
						</div>
						<span className="text-[10px] font-bold uppercase tracking-widest text-[var(--pp-muted)] sm:text-xs">
							{item.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

"use client";

import { useEffect, useState } from "react";
import { triggerSingleBurst } from "@/lib/celebration";

interface CelebrationTriggerProps {
	isLaunched: boolean;
    launchDate: string | null;
}

export default function CelebrationTrigger({ isLaunched, launchDate }: CelebrationTriggerProps) {
	useEffect(() => {
		if (!isLaunched || !launchDate) return;

		// Only celebrate if the launch happened in the last 2 hours
        // and only once per session
		const launchTime = new Date(launchDate).getTime();
		const now = new Date().getTime();
		const twoHours = 2 * 60 * 60 * 1000;

		const hasCelebrated = sessionStorage.getItem("pp_launch_celebrated");

		if (now - launchTime < twoHours && !hasCelebrated) {
			// Small delay for initial page load
			const timer = setTimeout(() => {
				triggerSingleBurst();
				sessionStorage.setItem("pp_launch_celebrated", "true");
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [isLaunched, launchDate]);

	return null;
}

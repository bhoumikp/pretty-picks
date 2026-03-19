"use client";

import { useState } from "react";
import { Check, Mail, ArrowRight } from "lucide-react";

export default function WaitlistForm() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
	const [message, setMessage] = useState("");
	const [couponCode, setCouponCode] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !email.includes("@")) return;

		setStatus("submitting");
		try {
			const res = await fetch("/api/waitlist", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim() }),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to join");
			
			setStatus("success");
			setCouponCode(data.couponCode);
			setMessage("You're on the list! Save your exclusive 50% launch code:");
			setEmail("");
		} catch (error) {
			setStatus("error");
			setMessage("Something went wrong. Please try again.");
		}
	};

	if (status === "success") {
		return (
			<div className="flex flex-col items-center justify-center space-y-4 rounded-3xl border border-[var(--pp-gold)]/30 bg-[var(--pp-gold)]/5 p-8 text-center animate-fade-in shadow-xl backdrop-blur-sm">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pp-gold)] text-[var(--pp-white)] shadow-lg">
					<Check className="h-6 w-6" />
				</div>
				<div className="space-y-2">
					<p className="text-sm font-medium text-[var(--pp-ink)]">{message}</p>
					{couponCode && (
						<div className="mt-4 flex flex-col items-center gap-2">
							<div className="bg-white border-2 border-dashed border-[var(--pp-gold)]/40 px-6 py-3 rounded-xl font-mono text-xl font-bold tracking-widest text-[var(--pp-gold)] shadow-sm">
								{couponCode}
							</div>
							<p className="text-[10px] uppercase tracking-widest text-[var(--pp-muted)]">
								Valid for one use @ {email}
							</p>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-lg mx-auto">
			<form onSubmit={handleSubmit} className="relative group">
				<div className="relative flex items-center">
					<div className="absolute left-4 text-[var(--pp-muted)] group-focus-within:text-[var(--pp-gold)] transition-colors">
						<Mail className="h-4 w-4" />
					</div>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Enter your email address..."
						className="h-14 w-full rounded-2xl border border-[var(--pp-border)] bg-white/80 pl-11 pr-24 sm:pr-32 text-sm outline-none backdrop-blur-sm transition-all focus:border-[var(--pp-gold)] focus:ring-1 focus:ring-[var(--pp-gold)]/20"
						required
						disabled={status === "submitting"}
					/>
					<button
						type="submit"
						disabled={status === "submitting" || !email}
						className="absolute right-2 h-10 px-4 sm:px-6 rounded-xl bg-[var(--pp-ink)] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[var(--pp-gold)] transition-all disabled:opacity-50 disabled:hover:bg-[var(--pp-ink)]"
					>
						{status === "submitting" ? (
							<span className="flex items-center gap-2">
								<div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
							</span>
						) : (
							<span className="flex items-center gap-2">
								Join <ArrowRight className="h-3.5 w-3.5" />
							</span>
						)}
					</button>
				</div>
				{status === "error" && (
					<p className="mt-2 text-xs text-red-500 text-center sm:text-left">{message}</p>
				)}
			</form>
			<p className="mt-3 text-[10px] text-center sm:text-left uppercase tracking-[0.2em] text-[var(--pp-muted)] opacity-60">
				Get 50% off your first order • No spam, ever.
			</p>
		</div>
	);
}

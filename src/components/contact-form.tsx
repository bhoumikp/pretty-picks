"use client";

import { useState } from "react";

export default function ContactForm() {
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
		"idle"
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setStatus("loading");
		setErrorMessage(null);
		const form = event.currentTarget;
		const formData = new FormData(form);

		const payload = {
			name: String(formData.get("name") ?? ""),
			email: String(formData.get("email") ?? ""),
			message: String(formData.get("message") ?? ""),
		};

		try {
			const response = await fetch("/api/contacts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!response.ok) throw new Error("Request failed");
			form.reset();
			setStatus("success");
			setErrorMessage(null);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Request failed";
			setErrorMessage(message);
			setStatus("error");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="mt-6 grid gap-4">
			<input
				name="name"
				required
				placeholder="Your name"
				className="rounded-xl border border-[var(--pp-border)] bg-white px-4 py-3 text-sm"
			/>
			<input
				name="email"
				type="email"
				required
				placeholder="Email address"
				className="rounded-xl border border-[var(--pp-border)] bg-white px-4 py-3 text-sm"
			/>
			<textarea
				name="message"
				required
				rows={4}
				placeholder="Tell us what you are looking for"
				className="rounded-xl border border-[var(--pp-border)] bg-white px-4 py-3 text-sm"
			/>
			<button
				type="submit"
				className="btn-primary text-sm"
				disabled={status === "loading"}
			>
				{status === "loading" ? "Sending..." : "Send message"}
			</button>
			{status === "success" && (
				<p className="text-sm text-green-700">Thanks! We will reply shortly.</p>
			)}
			{status === "error" && (
				<p className="text-sm text-red-600">
					{errorMessage ?? "Something went wrong. Try again."}
				</p>
			)}
		</form>
	);
}

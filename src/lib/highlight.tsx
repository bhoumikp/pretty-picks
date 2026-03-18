import type { ReactNode } from "react";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

export const highlightText = (text: string, query: string): ReactNode => {
	if (!query.trim()) return text;
	const safe = escapeRegExp(query.trim());
	const regex = new RegExp(`(${safe})`, "gi");
	const parts = text.split(regex);
	return parts.map((part, index) =>
		regex.test(part) ? (
			<mark key={`${part}-${index}`} className="admin-highlight">
				{part}
			</mark>
		) : (
			part
		)
	);
};

export type ValidationError = { field: string; message: string };
export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export const validateRequired = (value: string, field: string): ValidationError | null => {
	if (!value.trim()) return { field, message: `${field} is required.` };
	return null;
};

export const validateEmail = (value: string): ValidationError | null => {
	const trimmed = value.trim();
	if (!trimmed) return { field: "Email", message: "Email is required." };
	const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
	if (!isValid) return { field: "Email", message: "Please enter a valid email address." };
	return null;
};

export const validateMinLength = (
	value: string,
	min: number,
	field: string
): ValidationError | null => {
	if (value.trim().length < min) {
		return { field, message: `${field} must be at least ${min} characters.` };
	}
	return null;
};

export const validateMatch = (
	value: string,
	compareTo: string,
	field: string,
	compareField: string
): ValidationError | null => {
	if (value !== compareTo) {
		return { field, message: `${field} must match ${compareField}.` };
	}
	return null;
};

export const validateNumberMin = (
	value: number,
	min: number,
	field: string
): ValidationError | null => {
	if (Number.isNaN(value)) return { field, message: `${field} must be a number.` };
	if (value < min) return { field, message: `${field} must be at least ${min}.` };
	return null;
};

export const validatePhone = (value: string): ValidationError | null => {
	const trimmed = value.trim();
	if (!trimmed) return { field: "Phone", message: "Phone number is required." };
	const digits = trimmed.replace(/\D/g, "");
	if (digits.length < 8) {
		return { field: "Phone", message: "Please enter a valid phone number." };
	}
	return null;
};

export const validateUrlOptional = (value: string, field: string): ValidationError | null => {
	const trimmed = value.trim();
	if (!trimmed) return null;
	try {
		new URL(trimmed);
		return null;
	} catch {
		return { field, message: `${field} must be a valid URL.` };
	}
};

// Admin forms: prefer buildFieldErrors to map validation results in one place.
export const buildFieldErrors = <T extends string>(
	entries: Array<{ key: T; error: ValidationError | null; message?: string }>
): FieldErrors<T> => {
	const next: FieldErrors<T> = {};
	entries.forEach(({ key, error, message }) => {
		if (!error) return;
		next[key] = message ?? error.message;
	});
	return next;
};

export const focusFirstInvalid = <T extends string>(
	errors: FieldErrors<T>,
	fields: Array<{ key: T; selector: string }>
) => {
	if (typeof document === "undefined") return;
	const target = fields.find(({ key }) => Boolean(errors[key]));
	if (!target) return;
	const element = document.querySelector(target.selector) as HTMLElement | null;
	if (!element || typeof element.focus !== "function") return;
	window.requestAnimationFrame(() => {
		element.focus();
		element.classList.remove("admin-focus-bounce");
		// Force reflow so animation can replay on repeated submits.
		void element.offsetWidth;
		element.classList.add("admin-focus-bounce");
		window.setTimeout(() => element.classList.remove("admin-focus-bounce"), 650);
	});
};

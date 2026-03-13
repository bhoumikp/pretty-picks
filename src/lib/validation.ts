export type ValidationError = { field: string; message: string };

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

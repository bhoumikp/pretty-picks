export const formatCurrency = (value: number) => {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  if (digits.length <= 3) {
    return `${sign}₹${digits}`;
  }

  const last3 = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const parts: string[] = [];

  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }

  if (rest) parts.unshift(rest);

  return `${sign}₹${parts.join(",")},${last3}`;
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(value);

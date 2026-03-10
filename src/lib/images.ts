export type ProductImage = {
  url: string;
  publicId?: string | null;
};

export function normalizeImages(value: unknown): ProductImage[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return { url: item };
        if (item && typeof item === "object" && "url" in item) {
          const url = String((item as { url: string }).url);
          const publicId =
            "publicId" in item ? String((item as { publicId?: string }).publicId ?? "") : undefined;
          return { url, publicId: publicId || undefined };
        }
        return null;
      })
      .filter(Boolean) as ProductImage[];
  }
  return [];
}

export function primaryImage(value: unknown, fallback = "/images/placeholder.svg") {
  const images = normalizeImages(value);
  return images[0]?.url ?? fallback;
}

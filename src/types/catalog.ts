export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

export interface ProductImage {
  url: string;
  publicId?: string | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: unknown;
  featured?: boolean;
  stock?: number;
  material?: string;
  description?: string;
  category?: CategorySummary | null;
}

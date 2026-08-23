export interface CategorySummary {
	id: string;
	name: string;
	slug: string;
	image?: string | null;
	parentId?: string | null;
	parentName?: string | null;
	isActive?: boolean;
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
	stock?: number;
	material?: string;
	description?: string;
	createdAt?: string | Date;
	orderCount?: number;
	category?: CategorySummary | null;
}

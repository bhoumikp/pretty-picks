import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/data/site";

export const revalidate = 3600; // Regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = `https://${siteConfig.domain}`;

	// Static pages
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1.0,
		},
		{
			url: `${baseUrl}/products`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/categories`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/about`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${baseUrl}/contact`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
	];

	// Dynamic product pages
	let productPages: MetadataRoute.Sitemap = [];
	try {
		const products = await prisma.product.findMany({
			where: { archivedAt: null, isActive: true },
			select: { slug: true, updatedAt: true },
		});
		productPages = products.map((product) => ({
			url: `${baseUrl}/products/${product.slug}`,
			lastModified: product.updatedAt,
			changeFrequency: "weekly" as const,
			priority: 0.7,
		}));
	} catch (error) {
		console.error("Sitemap: failed to fetch products", error);
	}

	// Dynamic category pages
	let categoryPages: MetadataRoute.Sitemap = [];
	try {
		const categories = await prisma.category.findMany({
			where: { archivedAt: null, isActive: true },
			select: { slug: true, updatedAt: true },
		});
		categoryPages = categories.map((cat) => ({
			url: `${baseUrl}/category/${cat.slug}`,
			lastModified: cat.updatedAt,
			changeFrequency: "weekly" as const,
			priority: 0.6,
		}));
	} catch (error) {
		console.error("Sitemap: failed to fetch categories", error);
	}

	return [...staticPages, ...productPages, ...categoryPages];
}

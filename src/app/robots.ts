import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
	const baseUrl = `https://${siteConfig.domain}`;

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/admin/", "/api/"],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}

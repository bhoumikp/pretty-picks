import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { siteConfig } from "@/data/site";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getSiteSettings } from "@/lib/site-settings";

const headingFont = Playfair_Display({
	variable: "--font-heading",
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
});

const bodyFont = Manrope({
	variable: "--font-body",
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettings();
	const logoUrl = settings?.storefrontLogoUrl || "/favicon.ico";

	return {
		metadataBase: new URL(`https://${siteConfig.domain}`),
		title: {
			default: `${siteConfig.name} | Affordable Artificial Jewellery`,
			template: `%s | ${siteConfig.name}`,
		},
		description: siteConfig.description,
		icons: {
			icon: logoUrl,
			apple: logoUrl,
			shortcut: logoUrl,
		},
		openGraph: {
			title: siteConfig.name,
			description: siteConfig.description,
			url: `https://${siteConfig.domain}`,
			siteName: siteConfig.name,
			locale: "en_IN",
			type: "website",
			images: [{ url: logoUrl }],
		},
		twitter: {
			card: "summary_large_image",
			title: siteConfig.name,
			description: siteConfig.description,
			images: [logoUrl],
		},
		verification: {
			google: '6CiV3u526oPHhSCrfcZoCgVBzaa6j-IbxDbB21MC-EE',
		},
	};
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${headingFont.variable} ${bodyFont.variable} antialiased`}
				suppressHydrationWarning
			>
				{process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@graph": [
								{
									"@type": "Organization",
									"@id": `https://${siteConfig.domain}/#organization`,
									name: siteConfig.name,
									url: `https://${siteConfig.domain}`,
									description: siteConfig.description,
									contactPoint: {
										"@type": "ContactPoint",
										email: siteConfig.supportEmail,
										contactType: "customer service",
									},
									sameAs: [siteConfig.instagramUrl],
								},
								{
									"@type": "WebSite",
									"@id": `https://${siteConfig.domain}/#website`,
									url: `https://${siteConfig.domain}`,
									name: siteConfig.name,
									publisher: {
										"@id": `https://${siteConfig.domain}/#organization`,
									},
									potentialAction: {
										"@type": "SearchAction",
										target: {
											"@type": "EntryPoint",
											urlTemplate: `https://${siteConfig.domain}/products?q={search_term_string}`,
										},
										"query-input": "required name=search_term_string",
									},
								},
							],
						}),
					}}
				/>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}

export const siteConfig = {
	name: "Pretty Picks",
	description: "Affordable artificial jewellery for effortless everyday style.",
	domain: "shopprettypicks.in",
	whatsappNumber: "917350682392",
	instagramUrl: "https://www.instagram.com/prettypicksby__rj",
	supportEmail: "hello@shopprettypicks.in",
	developerGithub: "https://github.com/bhoumikp",
};

export const navigation = [
	{ label: "Home", href: "/" },
	{ label: "Products", href: "/products" },
	{ label: "Cart", href: "/cart" },
	{ label: "Earrings", href: "/category/earrings" },
	{ label: "Necklaces", href: "/category/necklaces" },
	{ label: "Rings", href: "/category/rings" },
	{ label: "Bangles", href: "/category/bangles" },
	{ label: "About", href: "/about" },
	{ label: "Contact Us", href: "/contact" },
];

export const trustBadges = [
	"Hypoallergenic finishes",
	"Ships across India",
	"Instagram-friendly styles",
	"Secure direct ordering",
];

export const instagramPosts = [
	{
		imageUrl: "/images/product-1.svg",
		postUrl: "https://www.instagram.com/p/XXXXXXXXXXX/",
		alt: "Pretty Picks Instagram post 1",
	},
	{
		imageUrl: "/images/product-2.svg",
		postUrl: "https://www.instagram.com/p/XXXXXXXXXX/",
		alt: "Pretty Picks Instagram post 2",
	},
	{
		imageUrl: "/images/product-3.svg",
		postUrl: "https://www.instagram.com/p/XXXXXXXXX/",
		alt: "Pretty Picks Instagram post 3",
	},
	{
		imageUrl: "/images/product-4.svg",
		postUrl: "https://www.instagram.com/p/XXXXXXXX/",
		alt: "Pretty Picks Instagram post 4",
	},
	{
		imageUrl: "/images/product-5.svg",
		postUrl: "https://www.instagram.com/p/XXXXXXX/",
		alt: "Pretty Picks Instagram post 5",
	},
	{
		imageUrl: "/images/product-6.svg",
		postUrl: "https://www.instagram.com/p/XXXXX/",
		alt: "Pretty Picks Instagram post 6",
	},
];

export const promoBanners = [
	{
		id: "new-arrivals",
		eyebrow: "Just Dropped",
		headline: "New Arrivals",
		sub: "Fresh styles every week",
		href: "/products",
		style: "gold", // gold gradient card
	},
	{
		id: "under-199",
		eyebrow: "Budget Picks",
		headline: "Under ₹199",
		sub: "Big sparkle, small price",
		href: "/products?price=199",
		style: "dark", // ink / dark card
	},
	{
		id: "anti-tarnish",
		eyebrow: "Our Promise",
		headline: "Anti-Tarnish",
		sub: "Guaranteed to last",
		href: "/products",
		style: "beige", // beige / neutral card
	},
] as const;

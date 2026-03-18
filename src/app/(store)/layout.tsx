import "../storefront.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import WhatsAppFab from "@/components/whatsapp-fab";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="storefront flex flex-col min-h-screen">
			<Navbar />
			<main className="flex-grow pt-20 md:pt-24">{children}</main>
			<Footer />
			<MobileBottomNav />
			<WhatsAppFab />
		</div>
	);
}

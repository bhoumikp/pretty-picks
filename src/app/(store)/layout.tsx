import "../storefront.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import WhatsAppFab from "@/components/whatsapp-fab";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="storefront">
			<Navbar />
			<main className="pt-20 md:pt-24">{children}</main>
			<Footer />
			<MobileBottomNav />
			<WhatsAppFab />
		</div>
	);
}

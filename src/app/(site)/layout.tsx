import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import WhatsAppButton from "@/components/whatsapp-button";
import MobileBottomNav from "@/components/mobile-bottom-nav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <WhatsAppButton
        floating
        message="Hi! I want to order from Pretty Picks. Please share the latest catalogue."
      />
      <MobileBottomNav />
    </div>
  );
}

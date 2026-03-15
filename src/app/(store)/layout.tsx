import "../storefront.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="storefront">
      <Navbar />
      <main className="pt-20 md:pt-24">{children}</main>
      <Footer />
    </div>
  );
}

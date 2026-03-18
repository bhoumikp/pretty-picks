import ContactForm from "@/components/contact-form";
import { siteConfig } from "@/data/site";
import WhatsAppButton from "@/components/whatsapp-button";

export const metadata = {
	title: "Contact",
	description: "Contact Pretty Picks for order support and styling help.",
};

export default function ContactPage() {
	return (
		<div className="page-shell section-pad max-w-5xl">
			<div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
				<div>
					<p className="section-kicker">Contact</p>
					<h1 className="section-title mt-2">Let us style you</h1>
					<p className="mt-4 text-sm text-[var(--pp-muted)]">
						Share what you are looking for and we will send recommendations on
						WhatsApp.
					</p>
					<ContactForm />
				</div>
				<div className="soft-card rounded-xl p-6">
					<h2 className="text-xl font-[var(--font-heading)]">Quick connect</h2>
					<p className="mt-3 text-sm text-[var(--pp-muted)]">
						Need a fast reply? Contact us on WhatsApp and we will guide you through
						the order.
					</p>
					<div className="mt-6">
						<WhatsAppButton
							message="Hi, I want to order from Pretty Picks. Please help me with recommendations."
							label="Contact us"
						/>
					</div>
					<div className="mt-6 text-sm">
						<p>Email: {siteConfig.supportEmail}</p>
						<p className="mt-2">Instagram: {siteConfig.instagramUrl}</p>
					</div>
				</div>
			</div>
		</div>
	);
}

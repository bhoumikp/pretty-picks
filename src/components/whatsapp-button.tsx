import { buildWhatsAppLink } from "@/lib/whatsapp";

interface WhatsAppButtonProps {
  message: string;
  label?: string;
  floating?: boolean;
}

export default function WhatsAppButton({
  message,
  label = "Order on WhatsApp",
  floating = false,
}: WhatsAppButtonProps) {
  const href = buildWhatsAppLink(message);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        floating
          ? "fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-105 md:bottom-6 md:right-6"
          : "inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#1fb95c]"
      }
    >
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <path
          d="M16 3C9.9 3 5 7.6 5 13.3c0 3 1.3 5.7 3.5 7.6L7 29l8.3-2.6c.2 0 .5.1.7.1 6.1 0 11-4.6 11-10.3S22.1 3 16 3z"
          fill="currentColor"
        />
        <path
          d="M22.3 19.8c-.3.7-1.3 1.1-2.1 1.1-.6 0-1.2-.1-2.7-.7-3.1-1.2-5.1-4.1-5.3-4.3-.1-.2-1.2-1.4-1.2-2.6s.7-1.8 1-2.1c.2-.2.6-.4.9-.4h.6c.2 0 .5 0 .7.6.3.7.9 2.1 1 2.2.1.2.1.4 0 .6-.1.2-.2.3-.4.5-.2.2-.4.4-.2.7.2.3 1 1.6 2.2 2.6 1.6 1.2 2.8 1.5 3.2 1.6.3.1.5.1.7-.1.2-.2.8-.8 1-1.1.2-.3.5-.2.8-.1.3.1 2 .8 2.3.9.3.2.5.2.6.4.1.2.1.9-.2 1.6z"
          fill="#fff"
        />
      </svg>
      {!floating && <span>{label}</span>}
    </a>
  );
}

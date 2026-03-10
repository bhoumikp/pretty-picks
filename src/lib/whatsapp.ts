import { siteConfig } from "@/data/site";

export const buildWhatsAppLink = (message: string) => {
  const text = encodeURIComponent(message);
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${text}`;
};

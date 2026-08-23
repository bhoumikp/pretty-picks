"use client";

import { createContext, useContext } from "react";
import { siteConfig } from "@/data/site";

type StorefrontSettings = {
	whatsappNumber: string;
};

const StorefrontSettingsContext = createContext<StorefrontSettings>({
	whatsappNumber: siteConfig.whatsappNumber,
});

export function StorefrontSettingsProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value: StorefrontSettings;
}) {
	return <StorefrontSettingsContext.Provider value={value}>{children}</StorefrontSettingsContext.Provider>;
}

export function useStorefrontSettings() {
	return useContext(StorefrontSettingsContext);
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { getSettings } from "@/actions/settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpendSmart AI",
  description: "Tu copiloto financiero inteligente",
  icons: {
    icon: "/spendsmart-icon.svg",
    shortcut: "/spendsmart-icon.svg",
    apple: "/spendsmart-icon.svg",
  },
};

import { Navigation } from "@/components/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await getSettings();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SettingsProvider
          initialSettings={data?.settings || null}
          initialProfile={data?.profile || null}
        >
          <Navigation />
          <div className="pt-16 md:pt-16 pb-20 md:pb-0">
            {children}
          </div>
        </SettingsProvider>
        <Toaster />
      </body>
    </html>
  );
}

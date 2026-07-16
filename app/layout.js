import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "VerifyMyTicket — Détectez les billets revendus plusieurs fois",
  description:
    "Enregistrez vos billets de concert et détectez si le même QR code circule déjà sur une plateforme de revente.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${jetbrains.variable} h-full`}>
      <body className="min-h-full antialiased bg-atmosphere">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import "./responsive.css";

export const metadata: Metadata = {
  title: "AHOE · Housing Opportunity Engine",
  description: "AI-powered housing development intelligence demonstration workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

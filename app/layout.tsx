import type { Metadata } from "next";
import { ReactNode } from "react";
import "./styles/globals.css"; // Import Tailwind CSS

export const metadata: Metadata = {
  title: "Football News App",
  description: "Get the latest football (soccer) news",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

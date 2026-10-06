import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Metadata identifying the example library rather than an authenticated account. */
export const metadata: Metadata = {
  title: "Board Games Tracker · Demo",
  description:
    "Explore a fictional board-game collection, wishlist, statistics, and game-night picker.",
};

/**
 * Supplies the document for the isolated static showcase.
 *
 * @param root0 - Statically rendered page content.
 * @param root0.children - Selected showcase page.
 * @returns A static document without authentication, headers, or database access.
 */
export default function DemoLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

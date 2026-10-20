import "./globals.css";

import english from "@messages/en.json";
import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Metadata identifying the example library rather than an authenticated account. */
export const metadata: Metadata = {
  icons: {
    icon: `${process.env.NEXT_PUBLIC_DEMO_BASE_PATH ?? ""}/favicon.png`,
  },
  title: english.demo.metaTitle,
  description: english.demo.metaDescription,
};

/** Showcase page rendered inside the static demo document. */
type DemoLayoutProps = {
  children: ReactNode;
};

/**
 * Supplies the document for the isolated static showcase.
 *
 * @param root0 - Statically rendered page content.
 * @param root0.children - Selected showcase page.
 * @returns A static document without authentication, headers, or database access.
 */
export default function DemoLayout({ children }: DemoLayoutProps): ReactNode {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

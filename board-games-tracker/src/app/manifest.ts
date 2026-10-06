import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Provides installable app metadata and Android-compatible icon sizes.
 *
 * The description is read from the message catalog of the visitor's locale, so
 * an install prompt matches the language the application is used in.
 *
 * @returns The web app manifest consumed by supported browsers.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("app");
  return {
    name: "Board Games Tracker",
    short_name: "Board Games Tracker",
    description: t("description"),
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f4ed",
    theme_color: "#18594b",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

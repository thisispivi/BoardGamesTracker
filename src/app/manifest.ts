import type { MetadataRoute } from "next";

/**
 * Provides installable app metadata and Android-compatible icon sizes.
 *
 * @returns The web app manifest consumed by supported browsers.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Board Games Tracker",
    short_name: "Games Tracker",
    description:
      "A secure, self-hosted board-game collection and game-night picker.",
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

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Bei GitHub Pages wird die App unter /<repo>/ ausgeliefert.
// Der Workflow setzt BASE_PATH=/<repo>/ ; lokal ist es "/".
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon.png", "favicon-48.png"],
      manifest: {
        name: "Haushalt – gemeinsam organisieren",
        short_name: "Haushalt",
        description:
          "Einkaufszettel, Gemeinschaftskonto, Fixkosten und Aufgaben fuer euren Haushalt.",
        theme_color: "#0f766e",
        background_color: "#0b1120",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        scope: base,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallbackDenylist: [/^https:\/\/script\./],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/script\.google\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/script\.googleusercontent\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-content",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});

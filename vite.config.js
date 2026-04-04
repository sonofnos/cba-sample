import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
            manifest: {
                name: "PanAfrika Bank",
                short_name: "PanAfrika",
                description: "PanAfrika Bank core banking application emulator",
                theme_color: "#0A3D2E",
                background_color: "#0A3D2E",
                display: "standalone",
                scope: "/",
                start_url: "/",
                icons: [
                    {
                        src: "pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-cache",
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/api\.fontshare\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "fontshare-cache",
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false,
            },
        }),
    ],
    build: {
        outDir: "dist",
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom", "react-router-dom"],
                    query: ["@tanstack/react-query", "@tanstack/react-table", "zustand"],
                    charts: ["recharts"],
                    ui: ["lucide-react", "clsx", "tailwind-merge", "class-variance-authority"],
                    forms: ["react-hook-form", "@hookform/resolvers", "zod"],
                },
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});

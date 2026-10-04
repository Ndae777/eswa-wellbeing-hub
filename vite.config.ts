import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

const isProduction = process.env["NODE_ENV"] === "production";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    nitro({
      // Deployment target. Nitro auto-detects Vercel/Netlify/Cloudflare when
      // deployed there; "node-server" is the correct default for a VPS/Docker.
      // Override with the NITRO_PRESET env var when needed.
      preset: process.env["NITRO_PRESET"] ?? "node-server",
      routeRules: {
        "/**": {
          headers: {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
            // Blocks other sites from framing ours, injecting a <base> tag, posting our
            // forms elsewhere, or loading plugins. A full script policy comes later.
            "Content-Security-Policy":
              "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
            ...(isProduction
              ? {
                  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
                }
              : {}),
          },
        },
      },
    }),
  ],
  build: {
    sourcemap: "hidden",
  },
});

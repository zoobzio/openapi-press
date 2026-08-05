import { defineNuxtConfig } from "nuxt/config";

/**
 * The openforge demo.
 *
 * The SDK lives in `shared/api.ts` — a plain openforge Forge, default
 * exported. The module registers it as the "api" client: SSR calls the host
 * directly, the browser calls the `/api/core` proxy. The upstream "API" is
 * this same app's nitro server under `/upstream`, so the whole round-trip is
 * self-contained.
 */
export default defineNuxtConfig({
  compatibilityDate: "2026-08-01",
  modules: ["@openforge/nuxt"],
  openforge: {
    clients: {
      api: {
        client: "~~/shared/api",
        host: "http://localhost:3000/upstream",
        prefix: "/api/core",
      },
    },
  },
});

/**
 * Nuxt plugin that builds every registered client and provides the bundle on
 * the nuxt app as `$forge`. Factories arrive through the build manifest;
 * config is resolved per environment — during SSR the upstream host directly
 * (with the incoming request's credential headers forwarded), in the browser
 * the client's proxy prefix. One app instance builds each client once: a
 * browser session holds one, each SSR request holds its own, so
 * request-scoped headers never leak across requests.
 */

import { KEY } from "@openforge/nuxt/constant";
import type { ClientConfig } from "openforge";

import { clients } from "#build/openforge.mjs";
import {
  defineNuxtPlugin,
  useRequestHeaders,
  useRuntimeConfig,
} from "#imports";

/** The config a named client resolves to in the current environment. */
const resolveConfig = (name: string): ClientConfig => {
  const runtime = useRuntimeConfig();
  const prefix = runtime.public[KEY]?.clients?.[name]?.prefix;
  if (prefix === undefined) {
    throw new Error(
      `openforge: no client named "${name}" — configure it under \`${KEY}.clients\` in nuxt.config.`,
    );
  }

  if (import.meta.server) {
    const host = runtime[KEY]?.clients?.[name]?.host;
    if (host === undefined) {
      throw new Error(
        `openforge: no upstream host for client "${name}" in server runtime config.`,
      );
    }
    // Forward the caller's credentials so SSR requests act as the user.
    const incoming = useRequestHeaders(["cookie", "authorization"]);
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (value !== undefined) headers[key] = value;
    }
    return { baseUrl: host, headers };
  }

  return { baseUrl: prefix };
};

export default defineNuxtPlugin({
  name: "openforge",
  setup: () => {
    const bundle: Record<string, unknown> = {};
    for (const [name, forge] of Object.entries(clients)) {
      if (typeof forge !== "function") {
        throw new Error(
          `openforge: client "${name}" module must default-export a Forge factory.`,
        );
      }
      bundle[name] = forge(resolveConfig(name));
    }
    return { provide: { forge: bundle } };
  },
});

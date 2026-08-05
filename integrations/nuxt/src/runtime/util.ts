/**
 * The runtime's config plumbing behind the composable: resolving a named
 * client's environment config, and layering caller wiring over it.
 */

import { KEY } from "@openapi-press/nuxt/constant";
import type { ClientConfig } from "openapi-press";

import { useRequestHeaders, useRuntimeConfig } from "#imports";

/** The config a named client resolves to in the current environment. */
export const resolveConfig = (name: string): ClientConfig => {
  const runtime = useRuntimeConfig();
  const prefix = runtime.public[KEY]?.clients?.[name]?.prefix;
  if (prefix === undefined) {
    throw new Error(
      `openapi-press: no client named "${name}" — configure it under \`${KEY}.clients\` in nuxt.config.`,
    );
  }

  if (import.meta.server) {
    const host = runtime[KEY]?.clients?.[name]?.host;
    if (host === undefined) {
      throw new Error(
        `openapi-press: no upstream host for client "${name}" in server runtime config.`,
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

/**
 * Layers caller wiring over the environment config. The caller wins on
 * conflict, except headers, which merge — the environment's forwarded
 * credentials survive a caller supplying its own headers.
 */
export const mergeConfig = (
  base: ClientConfig,
  override: ClientConfig,
): ClientConfig => {
  const merged: ClientConfig = { ...base, ...override };
  if (base.headers !== undefined && override.headers !== undefined) {
    const headers = new Headers(base.headers);
    new Headers(override.headers).forEach((value, key) => {
      headers.set(key, value);
    });
    merged.headers = headers;
  }
  return merged;
};

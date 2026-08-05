/**
 * The pure logic behind the module and its proxy: client-config
 * normalization and the path matching that routes a proxied request to the
 * right upstream. Kept free of Nuxt so it is testable as plain functions.
 */

import type { PressClientConfig, MatchedClient } from "./types";

/** Strips trailing slashes so host + path concatenation is unambiguous. */
export const normalizeHost = (host: string): string => host.replace(/\/+$/, "");

/** Strips trailing slashes; the prefix is always compared segment-wise. */
export const normalizePrefix = (prefix: string): string =>
  prefix.replace(/\/+$/, "");

/**
 * Validates and normalizes the configured clients: hosts must be absolute
 * http(s) origins, prefixes must be rooted paths.
 */
export const normalizeClients = (
  clients: Record<string, PressClientConfig>,
): Record<string, PressClientConfig> => {
  const out: Record<string, PressClientConfig> = {};
  for (const [name, client] of Object.entries(clients)) {
    if (typeof client.client !== "string" || client.client.length === 0) {
      throw new Error(
        `openapi-press: client "${name}" must point at a module whose default export is its Press.`,
      );
    }
    if (!/^https?:\/\//.test(client.host)) {
      throw new Error(
        `openapi-press: client "${name}" host must be an absolute http(s) URL.`,
      );
    }
    if (!client.prefix.startsWith("/")) {
      throw new Error(
        `openapi-press: client "${name}" prefix must start with "/".`,
      );
    }
    out[name] = {
      client: client.client,
      host: normalizeHost(client.host),
      prefix: normalizePrefix(client.prefix),
    };
  }
  return out;
};

/**
 * Resolves a request path to the configured client whose prefix matches it.
 * Matches are segment-wise (the prefix itself, or the prefix followed by a
 * path or query boundary); when prefixes nest, the longest wins.
 */
export const matchClient = (
  path: string,
  clients: Record<string, { prefix: string }>,
): MatchedClient | null => {
  let best: MatchedClient | null = null;
  for (const [name, { prefix }] of Object.entries(clients)) {
    const hit =
      path === prefix ||
      path.startsWith(`${prefix}/`) ||
      path.startsWith(`${prefix}?`);
    if (hit && (best === null || prefix.length > best.prefix.length)) {
      best = { name, prefix };
    }
  }
  return best;
};

/** The upstream URL a proxied request forwards to: host + path minus prefix. */
export const proxyTarget = (
  host: string,
  prefix: string,
  path: string,
): string => host + path.slice(prefix.length);

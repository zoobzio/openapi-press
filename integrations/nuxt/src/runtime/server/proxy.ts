/**
 * The per-client API proxy. Mounted at every configured prefix; resolves the
 * matched client from runtime config at request time and forwards the request
 * — method, remaining path, query, headers, body — to that client's upstream
 * host. The browser only ever sees the prefix.
 */

import { KEY } from "@openforge/nuxt/constant";
import { matchClient, proxyTarget } from "@openforge/nuxt/util";
import { createError, defineEventHandler, proxyRequest } from "h3";

import { useRuntimeConfig } from "#imports";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const matched = matchClient(event.path, config.public[KEY]?.clients ?? {});
  if (matched === null) {
    throw createError({
      statusCode: 404,
      statusMessage: "No openforge client mounted at this path",
    });
  }
  const host = config[KEY]?.clients?.[matched.name]?.host;
  if (host === undefined) {
    throw createError({
      statusCode: 502,
      statusMessage: `No upstream host configured for openforge client "${matched.name}"`,
    });
  }
  return proxyRequest(event, proxyTarget(host, matched.prefix, event.path));
});

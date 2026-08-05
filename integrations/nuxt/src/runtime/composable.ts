/**
 * `usePress(name, config?)` builds a registered client on demand: the
 * environment config — host or proxy prefix, forwarded credentials — layered
 * under whatever wiring the caller supplies (logger, hooks, mapError,
 * anything from `ClientConfig`). Every call builds fresh; builds are cheap.
 * An app that wants to share a wired client wraps this in its own
 * composable:
 *
 *     const useApi = () => usePress("api", { logger });
 */

import type { ClientConfig } from "openapi-press";

import { clients } from "#build/openapi-press.mjs";
import type { PressClients } from "#build/types/openapi-press";

import { mergeConfig, resolveConfig } from "./util";

/** The client registered under `name`, optionally rebuilt with caller wiring. */
export const usePress = <K extends keyof PressClients & string>(
  name: K,
  config: ClientConfig = {},
): PressClients[K] => {
  const cfg = resolveConfig(name);
  const merged = mergeConfig(cfg, config);
  return clients[name](merged);
};

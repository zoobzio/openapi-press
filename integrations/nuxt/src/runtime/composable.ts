/**
 * `useForge(name, config?)` builds a registered client on demand: the
 * environment config — host or proxy prefix, forwarded credentials — layered
 * under whatever wiring the caller supplies (logger, hooks, mapError,
 * anything from `ClientConfig`). Every call builds fresh; builds are cheap.
 * An app that wants to share a wired client wraps this in its own
 * composable:
 *
 *     const useApi = () => useForge("api", { logger });
 */

import type { ClientConfig } from "openforge";

import { clients } from "#build/openforge.mjs";
import type { ForgeClients } from "#build/types/openforge";

import { mergeConfig, resolveConfig } from "./util";

/** The client registered under `name`, optionally rebuilt with caller wiring. */
export const useForge = <K extends keyof ForgeClients & string>(
  name: K,
  config: ClientConfig = {},
): ForgeClients[K] => {
  const cfg = resolveConfig(name);
  const merged = mergeConfig(cfg, config);
  return clients[name](merged);
};

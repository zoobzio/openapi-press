/**
 * `useForge(name)` resolves a registered client from the `$forge` bundle the
 * plugin provided on the nuxt app. The type manifest derives the name union
 * and each client's type from the registered Forge modules, so the lookup is
 * fully typed at the call site.
 */

import type { ForgeClients } from "#build/types/openforge";
import { useNuxtApp } from "#imports";

/** The client registered under `name`, as the plugin provided it. */
export const useForge = <K extends keyof ForgeClients & string>(
  name: K,
): ForgeClients[K] => {
  const nuxt = useNuxtApp();
  return nuxt.$forge[name];
};

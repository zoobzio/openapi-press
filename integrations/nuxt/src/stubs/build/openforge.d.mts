// Typecheck-only stub for the generated `#build/openforge.mjs` manifest. The
// real module is written by the openforge nuxt module at build time; its
// companion `openforge.d.mts` types each entry as the registered module's
// actual Forge. Correlating the stub with ForgeClients is what lets the
// composable's lookup type without casts: indexing the mapped type by a name
// yields the Forge whose return is exactly that name's client.

import type { Forge } from "openforge";

import type { ForgeClients } from "#build/types/openforge";

export declare const clients: {
  [K in keyof ForgeClients]: Forge<ForgeClients[K]>;
};

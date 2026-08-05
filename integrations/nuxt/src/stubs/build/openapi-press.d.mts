// Typecheck-only stub for the generated `#build/openapi-press.mjs` manifest. The
// real module is written by the openapi-press nuxt module at build time; its
// companion `openapi-press.d.mts` types each entry as the registered module's
// actual Press. Correlating the stub with PressClients is what lets the
// composable's lookup type without casts: indexing the mapped type by a name
// yields the Press whose return is exactly that name's client.

import type { Press } from "openapi-press";

import type { PressClients } from "#build/types/openapi-press";

export declare const clients: {
  [K in keyof PressClients]: Press<PressClients[K]>;
};

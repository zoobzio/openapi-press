// Typecheck-only stub for the Nuxt `#imports` virtual module. The real
// implementations are supplied by Nuxt (app plane) and nitro (server plane)
// when the runtime files are compiled inside an app.

import type { HostPlane, PrefixPlane } from "@openforge/nuxt/types";

import type { ForgeClients } from "#build/types/openforge";

export declare const useNuxtApp: () => {
  $forge: ForgeClients;
};

export declare const defineNuxtPlugin: <
  T extends {
    name?: string;
    setup: () => { provide?: Record<string, unknown> } | void;
  },
>(
  plugin: T,
) => T;

export declare const useRuntimeConfig: (event?: unknown) => {
  openforge?: HostPlane;
  public: { openforge?: PrefixPlane };
};

export declare const useRequestHeaders: (
  include?: string[],
) => Record<string, string | undefined>;

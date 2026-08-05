// Typecheck-only stub for the Nuxt `#imports` virtual module. The real
// implementations are supplied by Nuxt (app plane) and nitro (server plane)
// when the runtime files are compiled inside an app.

import type { HostPlane, PrefixPlane } from "@openapi-press/nuxt/types";

export declare const useRuntimeConfig: (event?: unknown) => {
  press?: HostPlane;
  public: { press?: PrefixPlane };
};

export declare const useRequestHeaders: (
  include?: string[],
) => Record<string, string | undefined>;

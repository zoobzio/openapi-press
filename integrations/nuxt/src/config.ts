/**
 * The authoring helper for the module's nuxt.config section. The module
 * never sees a spec or a tree — SDKs are built by their authors as `Forge`
 * factories; the module's job is to make them usable in a Nuxt app.
 */

import type { NuxtOpenforgeConfig } from "./types";

/** Identity helper that types a Nuxt openforge configuration. */
export const defineOpenforgeConfig = (
  config: NuxtOpenforgeConfig,
): NuxtOpenforgeConfig => config;

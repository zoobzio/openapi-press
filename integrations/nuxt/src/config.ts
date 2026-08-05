/**
 * The authoring helper for the module's nuxt.config section. The module
 * never sees a spec or a tree — SDKs are built by their authors as `Press`
 * factories; the module's job is to make them usable in a Nuxt app.
 */

import type { NuxtPressConfig } from "./types";

/** Identity helper that types a Nuxt openapi-press configuration. */
export const definePressConfig = (config: NuxtPressConfig): NuxtPressConfig =>
  config;

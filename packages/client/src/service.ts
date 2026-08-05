/**
 * The typed front doors. `defineClient<paths>()` yields a `build` that turns
 * a namespace tree of descriptors into a live client. `defineForge<paths>()`
 * is the full authoring kit: `op` for descriptors and `client` to capture a
 * tree into a {@link Forge} — the config-accepting client factory that is the
 * unit integrations consume.
 */

import { defineSpec } from "@openforge/spec";

import { makeClient } from "./factory";
import type { Bound, ClientBuilder, ForgeBuilder } from "./types";

/** Binds a generated `paths` type and returns its client builder. */
export const defineClient = <Paths extends object>(): ClientBuilder<Paths> => ({
  build: (tree, config) =>
    makeClient(tree, config) as Bound<Paths, typeof tree>,
});

/** Binds a generated `paths` type and returns its authoring kit. */
export const defineForge = <Paths extends object>(): ForgeBuilder<Paths> => {
  const { op } = defineSpec<Paths>();
  const { build } = defineClient<Paths>();
  return {
    op,
    client: (tree) => (config) => build(tree, config),
  };
};

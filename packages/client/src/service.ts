/**
 * `defineClient<paths>()` is the typed front door. Binding the generated
 * `paths` type once yields a `build` that turns a namespace tree of
 * descriptors into a live client whose methods carry the spec-derived
 * signatures.
 */

import { makeClient } from "./factory";
import type { Bound, ClientBuilder } from "./types";

/** Binds a generated `paths` type and returns its client builder. */
export const defineClient = <Paths extends object>(): ClientBuilder<Paths> => ({
  build: (tree, config) =>
    makeClient(tree, config) as Bound<Paths, typeof tree>,
});

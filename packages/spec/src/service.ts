/**
 * `defineSpec<paths>()` is the typed front door. Binding the generated `paths`
 * type once yields an `op` factory whose path argument is constrained to the
 * paths that actually carry the given method — every descriptor it produces is
 * checked against the spec at the call site.
 */

import type { SpecBuilder } from "./types";
import { makeOp } from "./util";

/** Binds a generated `paths` type and returns its descriptor factory. */
export const defineSpec = <Paths extends object>(): SpecBuilder<Paths> => ({
  op: (method, path) => makeOp(method, path),
});

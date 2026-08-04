/**
 * `defineCall` turns a bare handler into an instrumented {@link Call}. The
 * `.with` combinator composes wrappers by rebuilding the call around the
 * wrapped handler, so instrumentation is immutable and chainable: each
 * `.with` derives a new call, never mutates one.
 */

import type { Call, CallMeta, Handler, Wrapper } from "./types";

/** Wraps a handler with its meta and the `.with` combinator. */
export const defineCall = <A extends unknown[], R>(
  handler: Handler<A, R>,
  meta: CallMeta,
): Call<A, R> => {
  const invoke: Handler<A, R> = (...args) => handler(...args);
  return Object.assign(invoke, {
    meta,
    // reduceRight applies the listed wrappers outside-in: with(a, b) builds
    // a(b(handler)). A later .with wraps the already-composed handler, so it
    // lands outside an earlier one.
    with: (...wrappers: Wrapper[]): Call<A, R> =>
      defineCall(
        wrappers.reduceRight<Handler<A, R>>(
          (next, wrapper) => wrapper(next, meta),
          handler,
        ),
        meta,
      ),
  });
};

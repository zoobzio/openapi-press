/**
 * @openapi-press/client — the wiring layer that turns spec descriptors into live,
 * typed API clients.
 *
 * A client package binds its generated `paths` with `defineClient`, composes
 * its `@openapi-press/spec` descriptors into a namespace tree, and calls
 * `build(tree, config)` to get a client of `@openapi-press/call` callables.
 * Failures throw from the `@openapi-press/error` hierarchy; behavior (retry,
 * timeouts, …) is applied per endpoint through `.with`.
 */

export * from "./constant";
export * from "./factory";
export * from "./service";
export * from "./types";

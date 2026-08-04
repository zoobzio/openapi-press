/**
 * @openforge/call — instrumented callables for API clients.
 *
 * A call is an async function carrying its endpoint meta and a `.with`
 * combinator; a wrapper is a signature-preserving transform of its handler.
 * The package ships the combinator core plus the wrappers every API caller
 * eventually wants (retry, timeout); consumers extend it by writing a
 * function.
 */

export * from "./constant";
export * from "./service";
export * from "./types";
export * from "./util";
export * from "./wrapper";

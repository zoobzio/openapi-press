/**
 * openforge — a client-creation utility for resource-namespaced SDKs.
 *
 * The public umbrella: the spec layer (descriptors and spec-derived types),
 * the call layer (the `.with` combinator and its wrappers), and the client
 * layer (wiring descriptors to a transport). The error hierarchy ships under
 * the `openforge/error` subpath.
 */

export * from "@openforge/call";
export * from "@openforge/client";
export * from "@openforge/spec";

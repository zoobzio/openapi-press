/**
 * openapi-press — a client-creation utility for resource-namespaced SDKs.
 *
 * The public umbrella: the spec layer (descriptors and spec-derived types),
 * the call layer (the `.with` combinator and its wrappers), and the client
 * layer (wiring descriptors to a transport). The error hierarchy ships under
 * the `openapi-press/error` subpath.
 */

export * from "@openapi-press/call";
export * from "@openapi-press/client";
export * from "@openapi-press/spec";

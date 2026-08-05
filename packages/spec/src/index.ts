/**
 * @openapi-press/spec — typed interactions with a generated OpenAPI `paths` type.
 *
 * Everything here is derivable from a user's spec: operation resolution, the
 * `{param}` path grammar, request and response shapes, and branded operation
 * descriptors. Client layers compose these into callable SDKs; nothing in this
 * package knows about transport or configuration.
 */

export * from "./constant";
export * from "./service";
export * from "./types";
export * from "./util";

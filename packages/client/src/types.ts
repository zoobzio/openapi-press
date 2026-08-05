/**
 * The client layer's contract: two-tier configuration ({@link ClientConfig}
 * applies to every call a client makes; {@link CallConfig} rides on an
 * individual call and overrides it), observability hooks, and the
 * call-signature composition that turns spec descriptors into typed
 * {@link Call}s. Behavior — retry, timeouts, and whatever else — is not
 * configured here: endpoints are instrumented through their `.with`
 * combinator from `@openapi-press/call`.
 */

import type { Call } from "@openapi-press/call";
import type { PressError } from "@openapi-press/error";
import type {
  OpData,
  OpDescriptor,
  OpOptions,
  Operation,
  PathArgs,
  PathParamNames,
  PathParamObject,
  SpecBuilder,
} from "@openapi-press/spec";
import type { HttpMethod, RequiredKeysOf } from "openapi-typescript-helpers";

/** Structured logger. All fields are optional metadata bags. */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface RequestHookContext {
  method: string;
  /** OpenAPI schema path with `{param}` placeholders. */
  path: string;
  request: Request;
}

export interface ResponseHookContext extends RequestHookContext {
  response: Response;
}

export interface ErrorHookContext {
  method: string;
  path: string;
  error: PressError;
}

/**
 * Observability hooks. They observe the request lifecycle; they do not mutate
 * it. All three fire per transport attempt with the real Request/Response —
 * retry, when an endpoint carries it, composes above this layer.
 */
export interface Hooks {
  onRequest?(ctx: RequestHookContext): void | Promise<void>;
  onResponse?(ctx: ResponseHookContext): void | Promise<void>;
  onError?(ctx: ErrorHookContext): void | Promise<void>;
}

/** Client-wide configuration, closed over by every bound method. */
export interface ClientConfig {
  /** Root URL prefixed to every request path. Defaults to "" (same-origin, relative). */
  baseUrl?: string;
  /** Custom fetch implementation. Defaults to `globalThis.fetch`. */
  fetch?: typeof globalThis.fetch;
  /** Headers merged into every request. */
  headers?: HeadersInit;
  /** Structured logger. Defaults to a no-op. */
  logger?: Logger;
  /**
   * Maps a PressError to the value that should actually be thrown (a rethrow
   * hook). Return a replacement error to throw it; return `undefined` to throw
   * the original PressError; throw from within to raise your own.
   */
  mapError?: (error: PressError) => unknown;
  /** Observability hooks. */
  hooks?: Hooks;
}

/** Per-call configuration, merged over {@link ClientConfig} (the call wins). */
export interface CallConfig {
  /** Abort signal for this call. */
  signal?: AbortSignal;
  /** Additional headers for this call, merged over the client headers. */
  headers?: HeadersInit;
}

/**
 * Everything a call accepts in its trailing options argument: the input the
 * spec admits (query, body) plus per-call configuration.
 */
export type CallOptions<Op> = OpOptions<Op> & CallConfig;

/**
 * The trailing options as a (possibly optional) argument tuple. It is required
 * only when the operation has a required body or required query; otherwise the
 * caller may omit it entirely.
 */
export type OptionsArg<Op> =
  RequiredKeysOf<CallOptions<Op>> extends never
    ? [options?: CallOptions<Op>]
    : [options: CallOptions<Op>];

/**
 * The instrumented callable a descriptor becomes: positional path params
 * derived from the path template, then a trailing options object, returning
 * the success payload directly (errors are thrown from the `@openapi-press/error`
 * hierarchy). As a {@link Call}, it carries `.with` for wrapping.
 */
export type BoundMethod<Paths, M extends HttpMethod, P extends string> =
  Operation<Paths, M, P> extends infer Op
    ? Call<
        [
          ...PathArgs<PathParamNames<P>, PathParamObject<Op>>,
          ...OptionsArg<Op>,
        ],
        OpData<Op>
      >
    : never;

/**
 * Recursively maps a namespace tree of descriptors to a tree of bound
 * methods, preserving the nesting. Leaves (descriptors) become callable;
 * branches recurse.
 */
export type Bound<Paths, T> =
  T extends OpDescriptor<infer M, infer P>
    ? BoundMethod<Paths, M, P>
    : { [K in keyof T]: Bound<Paths, T[K]> };

/** A bound method's runtime signature: positional path args then options. */
export type BoundFn = (...args: unknown[]) => Promise<unknown>;

/** Runtime handle binding descriptors to live calls. */
export interface Runtime {
  method(method: string, path: string): BoundFn;
}

/** The spec-bound client builder produced by {@link defineClient}. */
export interface ClientBuilder<Paths extends object> {
  build<Tree extends object>(
    tree: Tree,
    config?: ClientConfig,
  ): Bound<Paths, Tree>;
}

/**
 * A client factory: minimal config in, usable client out. The unit an SDK
 * author exports and an integration consumes — the integration supplies the
 * environment-appropriate config; the factory owns everything else.
 */
export type Press<T> = (config?: ClientConfig) => T;

/** The spec-bound authoring kit produced by {@link definePress}. */
export interface PressBuilder<Paths extends object> {
  /** Spec-checked descriptor factory (see `defineSpec`). */
  op: SpecBuilder<Paths>["op"];
  /** Captures a namespace tree into a {@link Press}. */
  client<Tree extends object>(tree: Tree): Press<Bound<Paths, Tree>>;
}

/**
 * Everything the package derives from a generated `paths` type: operation
 * resolution, the `{param}` path grammar, request and response shapes, and the
 * descriptor contract. All of it is compile-time only — the runtime
 * counterparts live in `util`.
 */

import type {
  HttpMethod,
  IsOperationRequestBodyOptional,
  OperationRequestBodyContent,
  MediaType,
  PathsWithMethod,
  ResponseObjectMap,
  SuccessResponse,
} from "openapi-typescript-helpers";

export type {
  HttpMethod,
  PathsWithMethod,
  MediaType,
  SuccessResponse,
  ResponseObjectMap,
  OperationRequestBodyContent,
  IsOperationRequestBodyOptional,
} from "openapi-typescript-helpers";

/** A declarative endpoint reference: an HTTP method paired with a path template. */
export interface OpDescriptor<
  M extends HttpMethod = HttpMethod,
  P extends string = string,
> {
  readonly method: M;
  readonly path: P;
}

/** The spec-bound descriptor factory produced by {@link defineSpec}. */
export interface SpecBuilder<Paths extends object> {
  op<M extends HttpMethod, P extends PathsWithMethod<Paths, M> & string>(
    method: M,
    path: P,
  ): OpDescriptor<M, P>;
}

/**
 * The operation object for a (method, path) pair within `Paths`, or `never`
 * when the path does not exist in the spec. The operation is the root every
 * other derivation computes from: its `parameters` drive path and query
 * typing, its `requestBody` drives body typing, and its `responses` drive the
 * payload type.
 */
export type Operation<Paths, M extends HttpMethod, P> = P extends keyof Paths
  ? M extends keyof Paths[P]
    ? Paths[P][M]
    : never
  : never;

/** Extracts `{param}` names from a path template type, in left-to-right order. */
export type PathParamNames<P extends string> =
  P extends `${string}{${infer Name}}${infer Rest}`
    ? [Name, ...PathParamNames<Rest>]
    : [];

/** The `parameters.path` object of an operation, or an empty object if none. */
export type PathParamObject<Op> = Op extends {
  parameters: { path?: infer PP };
}
  ? [PP] extends [undefined]
    ? Record<never, never>
    : PP
  : Record<never, never>;

/**
 * A positional tuple typed from the path template names and their param types.
 * Each element takes its type from the operation's `parameters.path` object,
 * falling back to `string` for names the operation does not declare.
 */
export type PathArgs<
  Names extends readonly string[],
  PP,
> = Names extends readonly [
  infer Head extends string,
  ...infer Tail extends readonly string[],
]
  ? [Head extends keyof PP ? PP[Head] : string, ...PathArgs<Tail, PP>]
  : [];

/**
 * The `query` fragment of an operation's input. It is omitted when the
 * operation has no query params, optional when every query param is optional,
 * and required when any query param is required. Optionality is read from the
 * `query` property itself (via indexed access, which preserves the
 * `| undefined` an optional property carries) rather than from the inferred
 * value type.
 */
export type QueryOption<Op> = Op extends { parameters: infer Params }
  ? "query" extends keyof Params
    ? Params["query"] extends infer Q
      ? [Q] extends [undefined]
        ? unknown
        : undefined extends Q
          ? { query?: Exclude<Q, undefined> }
          : { query: Q }
      : unknown
    : unknown
  : unknown;

/**
 * The `body` fragment of an operation's input (omitted when no body). A
 * body-less operation is generated as `requestBody?: never`, which
 * `OperationRequestBodyContent` reports as `undefined` — so absence is
 * `never | undefined`, not `never` alone. An optional body's content type
 * also carries `| undefined`, which is stripped since the property's own
 * optionality already expresses it.
 */
export type BodyOption<Op> =
  OperationRequestBodyContent<Op> extends infer B
    ? [B] extends [never | undefined]
      ? unknown
      : IsOperationRequestBodyOptional<Op> extends true
        ? { body?: Exclude<B, undefined> }
        : { body: B }
    : unknown;

/**
 * Everything the spec says an operation accepts as input beyond its path
 * params: query and body, as applicable. Each fragment resolves to `unknown`
 * when the operation does not admit it — intersecting `unknown` is the
 * identity, so the result carries only what applies. Layers composing call
 * signatures intersect their own concerns on top of this.
 */
export type OpOptions<Op> = QueryOption<Op> & BodyOption<Op>;

/** The success (2xx) JSON payload an operation resolves to. */
export type OpData<Op> =
  ResponseObjectMap<Op> extends infer R
    ? R extends Record<string | number, unknown>
      ? SuccessResponse<R, MediaType>
      : unknown
    : unknown;

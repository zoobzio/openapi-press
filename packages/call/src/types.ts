/**
 * The instrumentation contract: a call is an async function carrying its meta
 * and a `.with` combinator; a wrapper is a signature-preserving transform of
 * its handler. Everything the package ships — and everything consumers write
 * themselves — speaks these three types.
 */

/** What a call is about: the endpoint it targets. Wrappers read this for eligibility. */
export interface CallMeta {
  /** HTTP method, as the descriptor declared it. */
  method: string;
  /** OpenAPI schema path with `{param}` placeholders. */
  path: string;
}

/** A bare async function — the thing wrappers transform. */
export type Handler<A extends unknown[], R> = (...args: A) => Promise<R>;

/**
 * A signature-preserving transform of a handler. Generic over the handler's
 * shape, so one wrapper instruments any call regardless of its arguments or
 * result.
 */
export type Wrapper = <A extends unknown[], R>(
  next: Handler<A, R>,
  meta: CallMeta,
) => Handler<A, R>;

/**
 * An instrumented callable. `.with(...wrappers)` returns a new call with the
 * wrappers applied — the original is untouched, so wrapped variants can be
 * derived freely. Listed wrappers apply outside-in (`with(a, b)` runs `a`
 * around `b`), and a later `.with` wraps outside an earlier one.
 */
export interface Call<A extends unknown[], R> {
  (...args: A): Promise<R>;
  readonly meta: CallMeta;
  with(...wrappers: Wrapper[]): Call<A, R>;
}

/** Retry behavior. Overridden per field via `withRetry({ ... })`. */
export interface RetryPolicy {
  /** Maximum retries after the initial attempt. */
  attempts: number;
  /** Base backoff in ms; retry N waits `backoffMs * 2^(N-1)`. */
  backoffMs: number;
  /** HTTP methods eligible for retry (compared case-insensitively). */
  methods: string[];
  /** Whether a thrown error is worth retrying. */
  on: (error: unknown, meta: CallMeta) => boolean;
}

/**
 * Derives the identity of an invocation, for wrappers that group calls
 * (dedupe, cache). Two invocations with the same key are the same call.
 */
export type CallKey = (meta: CallMeta, args: unknown[]) => string;

/** Circuit-breaker behavior. Overridden per field via `withCircuitBreaker({ ... })`. */
export interface CircuitBreakerPolicy {
  /** Consecutive counted failures that open the circuit. */
  failures: number;
  /** How long an open circuit refuses calls before allowing a probe. */
  cooldownMs: number;
  /** Whether a thrown error counts toward opening the circuit. */
  on: (error: unknown, meta: CallMeta) => boolean;
}

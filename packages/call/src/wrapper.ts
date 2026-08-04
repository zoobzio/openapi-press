/**
 * The wrappers the package ships. Each is a `with*` factory returning a
 * {@link Wrapper}; the suggested pattern is to name the instance after the
 * behavior and apply it through `.with`:
 *
 *     const retry = withRetry();
 *     const breaker = withCircuitBreaker();
 *     const getUser = client.users.get.with(retry, breaker);
 *
 * Stateful wrappers (dedupe, cache, circuit breaker) keep their state in the
 * factory's closure: one instance applied to several endpoints shares state
 * across them; calling the factory per endpoint isolates it.
 */

import {
  CircuitOpenError,
  TimeoutError,
  UnauthorizedError,
} from "@openforge/error";

import { DEFAULT_CIRCUIT_BREAKER, DEFAULT_RETRY } from "./constant";
import type {
  CallKey,
  CallMeta,
  CircuitBreakerPolicy,
  Handler,
  RetryPolicy,
  Wrapper,
} from "./types";
import { backoff, callKey } from "./util";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Retries failed attempts under the policy: the method must be eligible and
 * the error must satisfy `on`. Waits exponentially between attempts.
 */
export const withRetry =
  (config: Partial<RetryPolicy> = {}): Wrapper =>
  (next, meta) => {
    const policy: RetryPolicy = { ...DEFAULT_RETRY, ...config };
    const eligible = policy.methods.includes(meta.method.toUpperCase());
    return async (...args) => {
      for (let attempt = 1; ; attempt++) {
        try {
          return await next(...args);
        } catch (error) {
          if (
            !eligible ||
            attempt > policy.attempts ||
            !policy.on(error, meta)
          ) {
            throw error;
          }
          await sleep(backoff(policy, attempt));
        }
      }
    };
  };

/**
 * Bounds the call to a time budget, rejecting with {@link TimeoutError} when
 * it runs out. The underlying work is not cancelled — pair with an abort
 * signal when the transport should stop too. Placed outside retry it bounds
 * the whole retried sequence; inside, each attempt.
 */
export const withTimeout =
  (ms: number): Wrapper =>
  (next, meta) =>
  (...args) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new TimeoutError({
            message: `Call timed out after ${ms}ms`,
            method: meta.method,
            path: meta.path,
          }),
        );
      }, ms);
      next(...args).then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error as Error);
        },
      );
    });

/**
 * Shares one in-flight promise among concurrent invocations with the same
 * key — identical calls made while one is running all settle with its result.
 * Once settled, the next invocation runs fresh.
 */
export const withDedupe = (key: CallKey = callKey): Wrapper => {
  const inflight = new Map<string, Promise<unknown>>();
  return <A extends unknown[], R>(
      next: Handler<A, R>,
      meta: CallMeta,
    ): Handler<A, R> =>
    (...args) => {
      const k = key(meta, args);
      const existing = inflight.get(k);
      if (existing !== undefined) return existing as Promise<R>;
      const promise = next(...args);
      inflight.set(k, promise);
      const clear = (): void => {
        inflight.delete(k);
      };
      promise.then(clear, clear);
      return promise;
    };
};

/**
 * Memoizes successful results for a time window, keyed per invocation.
 * Failures are never cached; an expired entry is refetched on the next call.
 */
export const withCache = (ttlMs: number, key: CallKey = callKey): Wrapper => {
  const entries = new Map<string, { value: unknown; expires: number }>();
  return <A extends unknown[], R>(
      next: Handler<A, R>,
      meta: CallMeta,
    ): Handler<A, R> =>
    async (...args) => {
      const k = key(meta, args);
      const hit = entries.get(k);
      if (hit !== undefined && hit.expires > Date.now()) {
        return hit.value as R;
      }
      entries.delete(k);
      const value = await next(...args);
      entries.set(k, { value, expires: Date.now() + ttlMs });
      return value;
    };
};

/**
 * Fails fast once the endpoint keeps failing: after `failures` consecutive
 * counted errors the circuit opens and calls reject with
 * {@link CircuitOpenError} without reaching the handler. After `cooldownMs`
 * one probe call is let through — success closes the circuit, failure
 * reopens it.
 */
export const withCircuitBreaker = (
  config: Partial<CircuitBreakerPolicy> = {},
): Wrapper => {
  const policy: CircuitBreakerPolicy = {
    ...DEFAULT_CIRCUIT_BREAKER,
    ...config,
  };
  let failures = 0;
  let openedAt = 0;
  let probing = false;
  return (next, meta) =>
    async (...args) => {
      if (openedAt !== 0) {
        if (Date.now() - openedAt < policy.cooldownMs || probing) {
          throw new CircuitOpenError({
            message: `Circuit open for ${meta.method} ${meta.path}`,
            method: meta.method,
            path: meta.path,
          });
        }
        probing = true;
      }
      try {
        const value = await next(...args);
        failures = 0;
        openedAt = 0;
        probing = false;
        return value;
      } catch (error) {
        const wasProbe = probing;
        probing = false;
        if (policy.on(error, meta)) {
          failures++;
          if (wasProbe || failures >= policy.failures) {
            openedAt = Date.now();
          }
        }
        throw error;
      }
    };
};

/**
 * Resolves with a computed default instead of throwing. The fallback must
 * produce the call's result type — the wrapper cannot verify that, so the
 * contract is the author's to keep.
 */
export const withFallback =
  (fallback: (error: unknown, meta: CallMeta) => unknown): Wrapper =>
  <A extends unknown[], R>(
    next: Handler<A, R>,
    meta: CallMeta,
  ): Handler<A, R> =>
  async (...args) => {
    try {
      return await next(...args);
    } catch (error) {
      return (await fallback(error, meta)) as R;
    }
  };

/**
 * Recovers from expired credentials: on {@link UnauthorizedError}, runs
 * `refresh` once and replays the call. The refresh must make the new
 * credentials visible to the transport (a fetch reading a token store,
 * cookies, …) — the replay sends whatever the transport now resolves. A
 * second UnauthorizedError propagates.
 */
export const withReauth =
  (
    refresh: (error: UnauthorizedError, meta: CallMeta) => void | Promise<void>,
  ): Wrapper =>
  (next, meta) =>
  async (...args) => {
    try {
      return await next(...args);
    } catch (error) {
      if (!(error instanceof UnauthorizedError)) throw error;
      await refresh(error, meta);
      return next(...args);
    }
  };

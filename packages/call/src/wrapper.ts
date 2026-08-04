/**
 * The wrappers the package ships. Each is a factory returning a
 * {@link Wrapper}, so instrumentation reads declaratively at the call site:
 * `call.with(retry({ attempts: 3 }), timeout(5000))`.
 */

import { TimeoutError } from "@openforge/error";

import { DEFAULT_RETRY } from "./constant";
import type { RetryPolicy, Wrapper } from "./types";
import { backoff } from "./util";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Retries failed attempts under the policy: the method must be eligible and
 * the error must satisfy `on`. Waits exponentially between attempts.
 */
export const retry =
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
 * signal when the transport should stop too. Placed outside `retry` it bounds
 * the whole retried sequence; inside, each attempt.
 */
export const timeout =
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

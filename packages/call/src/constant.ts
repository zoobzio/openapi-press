/**
 * The policies the stateful wrappers run with when their config says nothing.
 */

import type { CircuitBreakerPolicy, RetryPolicy } from "./types";
import { isTransient } from "./util";

/** A conservative default: only retry idempotent reads on transient failures. */
export const DEFAULT_RETRY: RetryPolicy = {
  attempts: 2,
  backoffMs: 200,
  methods: ["GET", "HEAD"],
  on: isTransient,
};

/** Open after five consecutive transient failures; probe after thirty seconds. */
export const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerPolicy = {
  failures: 5,
  cooldownMs: 30_000,
  on: isTransient,
};

/**
 * The predicates and arithmetic the wrappers are built from, exported so
 * consumers can reuse them in their own wrappers and policies.
 */

import { NetworkError, RateLimitError, ServerError } from "@openforge/error";

import type { RetryPolicy } from "./types";

/**
 * Whether an error is worth retrying on its face: the server failed, asked
 * for backpressure, or was never reached. Everything else — including aborts
 * and timeouts, which reflect the caller's own intent — is final.
 */
export const isTransient = (error: unknown): boolean =>
  error instanceof ServerError ||
  error instanceof RateLimitError ||
  error instanceof NetworkError;

/** Exponential backoff delay in ms for the Nth retry (1-based). */
export const backoff = (policy: RetryPolicy, retry: number): number =>
  policy.backoffMs * 2 ** (retry - 1);

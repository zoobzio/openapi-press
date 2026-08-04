/**
 * The policy `retry()` runs with when its config says nothing: a conservative
 * default that only retries idempotent reads on transient failures.
 */

import type { RetryPolicy } from "./types";
import { isTransient } from "./util";

export const DEFAULT_RETRY: RetryPolicy = {
  attempts: 2,
  backoffMs: 200,
  methods: ["GET", "HEAD"],
  on: isTransient,
};

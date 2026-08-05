import { describe, expect, it } from "vitest";

import { DEFAULT_CIRCUIT_BREAKER, DEFAULT_RETRY } from "../src/constant";
import { isTransient } from "../src/util";

describe("DEFAULT_RETRY", () => {
  it("retries twice with a 200ms base backoff", () => {
    expect(DEFAULT_RETRY.attempts).toBe(2);
    expect(DEFAULT_RETRY.backoffMs).toBe(200);
  });

  it("limits retries to idempotent reads", () => {
    expect(DEFAULT_RETRY.methods).toEqual(["GET", "HEAD"]);
  });

  it("gates retries on transience", () => {
    expect(DEFAULT_RETRY.on).toBe(isTransient);
  });
});

describe("DEFAULT_CIRCUIT_BREAKER", () => {
  it("opens after five failures and probes after thirty seconds", () => {
    expect(DEFAULT_CIRCUIT_BREAKER.failures).toBe(5);
    expect(DEFAULT_CIRCUIT_BREAKER.cooldownMs).toBe(30_000);
  });

  it("counts only transient failures toward opening", () => {
    expect(DEFAULT_CIRCUIT_BREAKER.on).toBe(isTransient);
  });
});

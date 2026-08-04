import {
  AbortError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TimeoutError,
} from "@openforge/error";
import { describe, expect, it } from "vitest";

import { DEFAULT_RETRY } from "../src/constant";
import { backoff, isTransient } from "../src/util";

const init = { message: "x", method: "get", path: "/" };
const httpInit = { ...init, status: 503, code: "HTTP_503" };

describe("isTransient", () => {
  it("accepts server failures, backpressure, and network failures", () => {
    expect(isTransient(new ServerError(httpInit))).toBe(true);
    expect(isTransient(new RateLimitError({ ...httpInit, status: 429 }))).toBe(
      true,
    );
    expect(isTransient(new NetworkError(init))).toBe(true);
  });

  it("rejects caller intent and definitive responses", () => {
    expect(isTransient(new AbortError(init))).toBe(false);
    expect(isTransient(new TimeoutError(init))).toBe(false);
    expect(isTransient(new NotFoundError({ ...httpInit, status: 404 }))).toBe(
      false,
    );
    expect(isTransient(new Error("plain"))).toBe(false);
    expect(isTransient("not an error")).toBe(false);
  });
});

describe("backoff", () => {
  it("doubles the base delay per retry", () => {
    const policy = { ...DEFAULT_RETRY, backoffMs: 200 };
    expect(backoff(policy, 1)).toBe(200);
    expect(backoff(policy, 2)).toBe(400);
    expect(backoff(policy, 3)).toBe(800);
  });
});

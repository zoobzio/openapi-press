import { describe, expect, it } from "vitest";

import * as press from "../src/index";

describe("openapi-press", () => {
  it("exposes the spec layer", () => {
    expect(press.defineSpec).toBeTypeOf("function");
    expect(press.makeOp).toBeTypeOf("function");
    expect(press.isOp).toBeTypeOf("function");
    expect(press.extractParams).toBeTypeOf("function");
  });

  it("exposes the call layer", () => {
    expect(press.defineCall).toBeTypeOf("function");
    expect(press.withRetry).toBeTypeOf("function");
    expect(press.withTimeout).toBeTypeOf("function");
    expect(press.withDedupe).toBeTypeOf("function");
    expect(press.withCache).toBeTypeOf("function");
    expect(press.withCircuitBreaker).toBeTypeOf("function");
    expect(press.withFallback).toBeTypeOf("function");
    expect(press.withReauth).toBeTypeOf("function");
  });

  it("exposes the client layer", () => {
    expect(press.defineClient).toBeTypeOf("function");
    expect(press.makeClient).toBeTypeOf("function");
  });
});

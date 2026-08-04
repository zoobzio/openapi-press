import { describe, expect, it } from "vitest";

import * as openforge from "../src/index";

describe("openforge", () => {
  it("exposes the spec layer", () => {
    expect(openforge.defineSpec).toBeTypeOf("function");
    expect(openforge.makeOp).toBeTypeOf("function");
    expect(openforge.isOp).toBeTypeOf("function");
    expect(openforge.extractParams).toBeTypeOf("function");
  });

  it("exposes the call layer", () => {
    expect(openforge.defineCall).toBeTypeOf("function");
    expect(openforge.withRetry).toBeTypeOf("function");
    expect(openforge.withTimeout).toBeTypeOf("function");
    expect(openforge.withDedupe).toBeTypeOf("function");
    expect(openforge.withCache).toBeTypeOf("function");
    expect(openforge.withCircuitBreaker).toBeTypeOf("function");
    expect(openforge.withFallback).toBeTypeOf("function");
    expect(openforge.withReauth).toBeTypeOf("function");
  });

  it("exposes the client layer", () => {
    expect(openforge.defineClient).toBeTypeOf("function");
    expect(openforge.makeClient).toBeTypeOf("function");
  });
});

import { describe, expect, expectTypeOf, it } from "vitest";

import { defineCall } from "../src/service";
import type { Call } from "../src/types";
import { META, trace } from "./fixture";

describe("defineCall", () => {
  it("invokes the handler with the caller's args", async () => {
    const call = defineCall(async (a: number, b: number) => a + b, META);
    await expect(call(2, 3)).resolves.toBe(5);
  });

  it("carries the meta", () => {
    const call = defineCall(async () => "ok", META);
    expect(call.meta).toEqual({ method: "get", path: "/users/{user_id}" });
  });

  it("preserves the handler signature in the call type", () => {
    const call = defineCall(async (id: string) => ({ id }), META);
    expectTypeOf(call).toEqualTypeOf<Call<[id: string], { id: string }>>();
    expectTypeOf(call.with()).toEqualTypeOf<typeof call>();
  });

  it("derives a new call from .with, leaving the original untouched", async () => {
    const log: string[] = [];
    const plain = defineCall(async () => "ok", META);
    const traced = plain.with(trace("a", log));
    await plain();
    expect(log).toEqual([]);
    await traced();
    expect(log).toEqual([">a", "<a"]);
    expect(traced.meta).toEqual(META);
  });

  it("applies listed wrappers outside-in", async () => {
    const log: string[] = [];
    const call = defineCall(async () => "ok", META).with(
      trace("a", log),
      trace("b", log),
    );
    await call();
    expect(log).toEqual([">a", ">b", "<b", "<a"]);
  });

  it("places a later .with outside an earlier one", async () => {
    const log: string[] = [];
    const call = defineCall(async () => "ok", META)
      .with(trace("a", log))
      .with(trace("b", log));
    await call();
    expect(log).toEqual([">b", ">a", "<a", "<b"]);
  });
});

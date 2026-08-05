import { describe, expectTypeOf, it } from "vitest";

import { defineCall } from "../src/service";
import type { Call, CallKey, CallMeta, Handler, Wrapper } from "../src/types";

describe("Handler", () => {
  it("is a variadic async function over its argument tuple", () => {
    expectTypeOf<Handler<[string, number], boolean>>().toEqualTypeOf<
      (...args: [string, number]) => Promise<boolean>
    >();
  });
});

describe("Wrapper", () => {
  it("preserves the handler signature it transforms", () => {
    const identity: Wrapper = (next) => next;
    const wrapped = identity<[string], number>(async (s) => s.length, {
      method: "get",
      path: "/",
    });
    expectTypeOf(wrapped).toEqualTypeOf<Handler<[string], number>>();
  });
});

describe("Call", () => {
  it("is callable with the handler's args and returns its result", () => {
    expectTypeOf<
      Parameters<Call<[user_id: string], { id: string }>>
    >().toEqualTypeOf<[user_id: string]>();
    expectTypeOf<
      ReturnType<Call<[user_id: string], { id: string }>>
    >().toEqualTypeOf<Promise<{ id: string }>>();
  });

  it("carries readonly meta and a wrapper-composing .with", () => {
    expectTypeOf<Call<[], void>["meta"]>().toEqualTypeOf<CallMeta>();
    expectTypeOf<Call<[], void>["with"]>().parameters.toEqualTypeOf<
      Wrapper[]
    >();
    expectTypeOf<Call<[], void>["with"]>().returns.toEqualTypeOf<
      Call<[], void>
    >();
  });

  it("is what defineCall produces from a handler and its meta", () => {
    const call = defineCall(async (n: number) => n + 1, {
      method: "get",
      path: "/",
    });
    expectTypeOf(call).toEqualTypeOf<Call<[n: number], number>>();
  });
});

describe("CallKey", () => {
  it("derives a string identity from meta and args", () => {
    expectTypeOf<CallKey>().toEqualTypeOf<
      (meta: CallMeta, args: unknown[]) => string
    >();
  });
});

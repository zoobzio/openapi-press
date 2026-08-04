import { describe, expect, expectTypeOf, it } from "vitest";

import type { PathParamNames } from "../src/types";
import { extractParams, isOp, makeOp } from "../src/util";

describe("makeOp", () => {
  it("carries the method and path", () => {
    const op = makeOp("get", "/users/{user_id}");
    expect(op.method).toBe("get");
    expect(op.path).toBe("/users/{user_id}");
  });
});

describe("isOp", () => {
  it("accepts a descriptor made by makeOp", () => {
    expect(isOp(makeOp("get", "/users"))).toBe(true);
  });

  it("rejects a plain object with the same shape", () => {
    expect(isOp({ method: "get", path: "/users" })).toBe(false);
  });

  it("rejects a namespace branch containing descriptors", () => {
    expect(isOp({ list: makeOp("get", "/users") })).toBe(false);
  });

  it("rejects primitives and null", () => {
    expect(isOp(null)).toBe(false);
    expect(isOp(undefined)).toBe(false);
    expect(isOp("get")).toBe(false);
    expect(isOp(42)).toBe(false);
  });
});

describe("extractParams", () => {
  it("returns no names for a template without params", () => {
    expect(extractParams("/users")).toEqual([]);
  });

  it("extracts a single param name", () => {
    expect(extractParams("/users/{user_id}")).toEqual(["user_id"]);
  });

  it("extracts multiple param names in order", () => {
    expect(extractParams("/users/{user_id}/accounts/{account_id}")).toEqual([
      "user_id",
      "account_id",
    ]);
  });

  it("agrees with PathParamNames on the same template", () => {
    const names = extractParams("/users/{user_id}/accounts/{account_id}");
    expectTypeOf<
      PathParamNames<"/users/{user_id}/accounts/{account_id}">
    >().toEqualTypeOf<["user_id", "account_id"]>();
    expect(names).toEqual(["user_id", "account_id"]);
  });
});

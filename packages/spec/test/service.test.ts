import { describe, expect, expectTypeOf, it } from "vitest";

import { defineSpec } from "../src/service";
import type { OpDescriptor } from "../src/types";
import { isOp } from "../src/util";
import type { paths } from "./fixture";

const { op } = defineSpec<paths>();

describe("defineSpec", () => {
  it("produces branded descriptors", () => {
    const users = op("get", "/users");
    expect(isOp(users)).toBe(true);
    expect(users.method).toBe("get");
    expect(users.path).toBe("/users");
  });

  it("preserves the literal method and path in the descriptor type", () => {
    expectTypeOf(op("get", "/users")).toEqualTypeOf<
      OpDescriptor<"get", "/users">
    >();
  });

  it("constrains paths to those carrying the method", () => {
    // @ts-expect-error — /search declares no post operation
    void (() => op("post", "/search"));
    // @ts-expect-error — the path does not exist in the spec
    void (() => op("get", "/missing"));
  });
});

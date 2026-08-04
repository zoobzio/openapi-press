import type { OpDescriptor, Operation } from "@openforge/spec";
import { describe, expectTypeOf, it } from "vitest";

import type {
  Bound,
  BoundMethod,
  CallConfig,
  CallOptions,
  OptionsArg,
} from "../src/types";
import type { User, paths } from "./fixture";

type ListOp = Operation<paths, "get", "/users">;
type GetOp = Operation<paths, "get", "/users/{user_id}">;
type CreateOp = Operation<paths, "post", "/users">;
type UnlinkOp = Operation<
  paths,
  "delete",
  "/users/{user_id}/accounts/{account_id}"
>;

describe("CallOptions", () => {
  it("intersects the spec input with per-call config", () => {
    expectTypeOf<CallOptions<GetOp>>().toEqualTypeOf<CallConfig>();
    expectTypeOf<CallOptions<CreateOp>>().toEqualTypeOf<
      { body: { name: string } } & CallConfig
    >();
  });
});

describe("OptionsArg", () => {
  it("is omittable when the operation requires no input", () => {
    expectTypeOf<OptionsArg<ListOp>["length"]>().toEqualTypeOf<0 | 1>();
  });

  it("is required when the operation requires a body", () => {
    expectTypeOf<OptionsArg<CreateOp>["length"]>().toEqualTypeOf<1>();
  });
});

describe("BoundMethod", () => {
  it("derives positional path params and the options argument", () => {
    type Fn = BoundMethod<paths, "get", "/users/{user_id}">;
    expectTypeOf<Parameters<Fn>>().toEqualTypeOf<
      [user_id: string, options?: CallOptions<GetOp>]
    >();
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<Promise<User>>();
  });

  it("derives one positional arg per template param, in order", () => {
    type Fn = BoundMethod<
      paths,
      "delete",
      "/users/{user_id}/accounts/{account_id}"
    >;
    expectTypeOf<Parameters<Fn>>().toEqualTypeOf<
      [user_id: string, account_id: string, options?: CallOptions<UnlinkOp>]
    >();
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<Promise<{ ok: boolean }>>();
  });

  it("requires the options argument when the body is required", () => {
    type Fn = BoundMethod<paths, "post", "/users">;
    expectTypeOf<Parameters<Fn>>().toEqualTypeOf<
      [options: CallOptions<CreateOp>]
    >();
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<Promise<User>>();
  });
});

describe("Bound", () => {
  it("maps descriptor leaves to methods and recurses into branches", () => {
    type Tree = {
      users: {
        list: OpDescriptor<"get", "/users">;
        get: OpDescriptor<"get", "/users/{user_id}">;
        accounts: {
          unlink: OpDescriptor<
            "delete",
            "/users/{user_id}/accounts/{account_id}"
          >;
        };
      };
    };
    type Client = Bound<paths, Tree>;
    expectTypeOf<Client["users"]["list"]>().toEqualTypeOf<
      BoundMethod<paths, "get", "/users">
    >();
    expectTypeOf<Client["users"]["accounts"]["unlink"]>().toEqualTypeOf<
      BoundMethod<paths, "delete", "/users/{user_id}/accounts/{account_id}">
    >();
  });
});

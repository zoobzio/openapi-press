import { describe, expectTypeOf, it } from "vitest";

import type {
  BodyOption,
  OpData,
  OpOptions,
  Operation,
  PathArgs,
  PathParamNames,
  PathParamObject,
  QueryOption,
} from "../src/types";
import type { paths, User } from "./fixture";

describe("Operation", () => {
  it("resolves the operation object for a (method, path) pair", () => {
    type Op = Operation<paths, "get", "/users">;
    expectTypeOf<
      Op["responses"][200]["content"]["application/json"]
    >().toEqualTypeOf<User[]>();
  });

  it("distinguishes operations by method on the same path", () => {
    type Get = Operation<paths, "get", "/users">;
    type Post = Operation<paths, "post", "/users">;
    expectTypeOf<Get["requestBody"]>().toEqualTypeOf<undefined>();
    expectTypeOf<
      Post["requestBody"]["content"]["application/json"]
    >().toEqualTypeOf<{ name: string }>();
  });

  it("resolves never for a path the spec does not declare", () => {
    expectTypeOf<Operation<paths, "get", "/missing">>().toBeNever();
  });
});

describe("PathParamNames", () => {
  it("resolves an empty tuple for a template without params", () => {
    expectTypeOf<PathParamNames<"/users">>().toEqualTypeOf<[]>();
  });

  it("resolves a single-name tuple", () => {
    expectTypeOf<PathParamNames<"/users/{user_id}">>().toEqualTypeOf<
      ["user_id"]
    >();
  });

  it("resolves multiple names in template order", () => {
    expectTypeOf<
      PathParamNames<"/users/{user_id}/accounts/{account_id}">
    >().toEqualTypeOf<["user_id", "account_id"]>();
  });
});

describe("PathParamObject", () => {
  it("resolves the operation's path params", () => {
    type Op = Operation<paths, "get", "/users/{user_id}">;
    expectTypeOf<PathParamObject<Op>>().toEqualTypeOf<{ user_id: string }>();
  });

  it("resolves an empty object when the operation has no path params", () => {
    type Op = Operation<paths, "get", "/users">;
    expectTypeOf<PathParamObject<Op>>().toEqualTypeOf<Record<never, never>>();
  });
});

describe("PathArgs", () => {
  it("types each positional arg from the param object", () => {
    expectTypeOf<
      PathArgs<
        ["user_id", "account_id"],
        { user_id: string; account_id: string }
      >
    >().toEqualTypeOf<[string, string]>();
  });

  it("preserves non-string param types", () => {
    expectTypeOf<PathArgs<["id"], { id: number }>>().toEqualTypeOf<[number]>();
  });

  it("falls back to string for undeclared names", () => {
    expectTypeOf<PathArgs<["id"], Record<never, never>>>().toEqualTypeOf<
      [string]
    >();
  });
});

describe("QueryOption", () => {
  it("is optional when every query param is optional", () => {
    type Op = Operation<paths, "get", "/users">;
    expectTypeOf<QueryOption<Op>>().toEqualTypeOf<{
      query?: { limit?: number; offset?: number };
    }>();
  });

  it("is required when any query param is required", () => {
    type Op = Operation<paths, "get", "/search">;
    expectTypeOf<QueryOption<Op>>().toEqualTypeOf<{
      query: { q: string; page?: number };
    }>();
  });

  it("vanishes when the operation has no query params", () => {
    type Op = Operation<paths, "get", "/users/{user_id}">;
    expectTypeOf<QueryOption<Op>>().toBeUnknown();
  });
});

describe("BodyOption", () => {
  it("is required when the operation requires a body", () => {
    type Op = Operation<paths, "post", "/users">;
    expectTypeOf<BodyOption<Op>>().toEqualTypeOf<{
      body: { name: string };
    }>();
  });

  it("is optional when the operation's body is optional", () => {
    type Op = Operation<paths, "patch", "/users/{user_id}">;
    expectTypeOf<BodyOption<Op>>().toEqualTypeOf<{
      body?: { name?: string };
    }>();
  });

  it("vanishes when the operation has no body", () => {
    type Op = Operation<paths, "get", "/users">;
    expectTypeOf<BodyOption<Op>>().toBeUnknown();
  });
});

describe("OpOptions", () => {
  it("carries only the fragments the operation admits", () => {
    type QueryOnly = Operation<paths, "get", "/users">;
    type BodyOnly = Operation<paths, "post", "/users">;
    expectTypeOf<OpOptions<QueryOnly>>().toEqualTypeOf<{
      query?: { limit?: number; offset?: number };
    }>();
    expectTypeOf<OpOptions<BodyOnly>>().toEqualTypeOf<{
      body: { name: string };
    }>();
  });

  it("is unknown when the operation admits no input", () => {
    type Op = Operation<paths, "get", "/users/{user_id}">;
    expectTypeOf<OpOptions<Op>>().toBeUnknown();
  });
});

describe("OpData", () => {
  it("resolves the 200 JSON payload", () => {
    type Op = Operation<paths, "get", "/users">;
    expectTypeOf<OpData<Op>>().toEqualTypeOf<User[]>();
  });

  it("resolves any 2xx payload, not just 200", () => {
    type Op = Operation<paths, "post", "/users">;
    expectTypeOf<OpData<Op>>().toEqualTypeOf<User>();
  });
});

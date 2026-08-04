import { defineSpec } from "@openforge/spec";
import type { Operation } from "@openforge/spec";
import { describe, expect, expectTypeOf, it } from "vitest";

import { defineClient } from "../src/service";
import type { CallOptions } from "../src/types";
import { jsonResponse, makeFetch } from "./fixture";
import type { User, paths } from "./fixture";

const { op } = defineSpec<paths>();
const { build } = defineClient<paths>();

const tree = {
  users: {
    list: op("get", "/users"),
    get: op("get", "/users/{user_id}"),
    create: op("post", "/users"),
  },
};

describe("defineClient", () => {
  it("builds a live client from a namespace tree", async () => {
    const { fetch } = makeFetch(() =>
      jsonResponse(200, { id: "u1", name: "Ada" }),
    );
    const client = build(tree, { baseUrl: "https://api.test", fetch });
    await expect(client.users.get("u1")).resolves.toEqual({
      id: "u1",
      name: "Ada",
    });
  });

  it("carries the spec-derived signatures through to the built client", () => {
    const client = build(tree);
    type GetOp = Operation<paths, "get", "/users/{user_id}">;
    type CreateOp = Operation<paths, "post", "/users">;
    expectTypeOf(client.users.get).parameters.toEqualTypeOf<
      [user_id: string, options?: CallOptions<GetOp>]
    >();
    expectTypeOf(client.users.create).parameters.toEqualTypeOf<
      [options: CallOptions<CreateOp>]
    >();
    expectTypeOf(client.users.list).returns.toEqualTypeOf<Promise<User[]>>();
  });

  it("exposes .with on every endpoint, preserving the signature", () => {
    const client = build(tree);
    expectTypeOf(client.users.get.with()).toEqualTypeOf<
      typeof client.users.get
    >();
  });
});

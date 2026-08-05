import { defineSpec, isOp } from "@openforge/spec";
import type { Operation } from "@openforge/spec";
import { describe, expect, expectTypeOf, it } from "vitest";

import { defineClient, defineForge } from "../src/service";
import type { CallOptions, ClientConfig, Forge } from "../src/types";
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

describe("defineForge", () => {
  const forge = defineForge<paths>();
  const createApi = forge.client({
    users: {
      list: forge.op("get", "/users"),
      get: forge.op("get", "/users/{user_id}"),
    },
  });

  it("produces spec-checked descriptors through op", () => {
    expect(isOp(forge.op("get", "/users"))).toBe(true);
  });

  it("captures a tree into a config-accepting factory", async () => {
    const { fetch, requests } = makeFetch(() =>
      jsonResponse(200, { id: "u1", name: "Ada" }),
    );
    const api = createApi({ baseUrl: "https://api.test", fetch });
    await expect(api.users.get("u1")).resolves.toEqual({
      id: "u1",
      name: "Ada",
    });
    expect(requests[0]?.url).toBe("https://api.test/users/u1");
  });

  it("yields independent clients per config", async () => {
    const a = makeFetch(() => jsonResponse(200, []));
    const b = makeFetch(() => jsonResponse(200, []));
    await createApi({ baseUrl: "https://a.test", fetch: a.fetch }).users.list();
    await createApi({ baseUrl: "https://b.test", fetch: b.fetch }).users.list();
    expect(a.requests[0]?.url).toBe("https://a.test/users");
    expect(b.requests[0]?.url).toBe("https://b.test/users");
  });

  it("types the factory as a Forge over the bound tree", () => {
    expectTypeOf(createApi).parameters.toEqualTypeOf<[config?: ClientConfig]>();
    expectTypeOf(createApi).toMatchTypeOf<
      Forge<ReturnType<typeof createApi>>
    >();
    const api = createApi();
    expectTypeOf(api.users.list).returns.toEqualTypeOf<Promise<User[]>>();
  });
});

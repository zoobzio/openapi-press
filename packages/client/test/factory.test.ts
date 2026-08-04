import { retry } from "@openforge/call";
import type { Call } from "@openforge/call";
import { NetworkError, NotFoundError, ServerError } from "@openforge/error";
import { defineSpec } from "@openforge/spec";
import { describe, expect, it } from "vitest";

import { makeClient } from "../src/factory";
import type { ClientConfig } from "../src/types";
import { jsonResponse, makeFetch } from "./fixture";
import type { paths } from "./fixture";

const { op } = defineSpec<paths>();

const tree = {
  users: {
    list: op("get", "/users"),
    get: op("get", "/users/{user_id}"),
    create: op("post", "/users"),
    accounts: {
      unlink: op("delete", "/users/{user_id}/accounts/{account_id}"),
    },
  },
};

/** The bound tree as the factory produces it, before the typed layer. */
type Fn = Call<unknown[], unknown>;
interface TestClient {
  users: {
    list: Fn;
    get: Fn;
    create: Fn;
    accounts: { unlink: Fn };
  };
}

const build = (config: ClientConfig): TestClient =>
  makeClient(tree, {
    baseUrl: "https://api.test",
    ...config,
  }) as unknown as TestClient;

describe("makeClient", () => {
  it("binds descriptor leaves and preserves namespace nesting", async () => {
    const { fetch, requests } = makeFetch(() =>
      jsonResponse(200, [{ id: "u1", name: "Ada" }]),
    );
    const client = build({ fetch });
    const users = await client.users.list();
    expect(users).toEqual([{ id: "u1", name: "Ada" }]);
    expect(requests[0]?.method).toBe("GET");
    expect(requests[0]?.url).toBe("https://api.test/users");
  });

  it("carries the descriptor as call meta", () => {
    const client = build({});
    expect(client.users.get.meta).toEqual({
      method: "get",
      path: "/users/{user_id}",
    });
  });

  it("substitutes positional args into the path template, in order", async () => {
    const { fetch, requests } = makeFetch(() =>
      jsonResponse(200, { ok: true }),
    );
    const client = build({ fetch });
    await client.users.get("u1");
    await client.users.accounts.unlink("u1", "a1");
    expect(requests[0]?.url).toBe("https://api.test/users/u1");
    expect(requests[1]?.url).toBe("https://api.test/users/u1/accounts/a1");
  });

  it("serializes query params", async () => {
    const { fetch, requests } = makeFetch(() => jsonResponse(200, []));
    const client = build({ fetch });
    await client.users.list({ query: { limit: 5, offset: 10 } });
    expect(requests[0]?.url).toBe("https://api.test/users?limit=5&offset=10");
  });

  it("sends the body as JSON", async () => {
    const { fetch, requests } = makeFetch(() =>
      jsonResponse(201, { id: "u2", name: "Grace" }),
    );
    const client = build({ fetch });
    const created = await client.users.create({ body: { name: "Grace" } });
    expect(created).toEqual({ id: "u2", name: "Grace" });
    expect(requests[0]?.method).toBe("POST");
    expect(requests[0]?.body).toBe(JSON.stringify({ name: "Grace" }));
  });

  it("merges call headers over client headers", async () => {
    const { fetch, requests } = makeFetch(() => jsonResponse(200, []));
    const client = build({ fetch, headers: { "x-client": "1" } });
    await client.users.list({ headers: { "x-call": "2" } });
    expect(requests[0]?.headers.get("x-client")).toBe("1");
    expect(requests[0]?.headers.get("x-call")).toBe("2");
  });

  it("throws the status-appropriate error carrying the API's code", async () => {
    const { fetch } = makeFetch(() =>
      jsonResponse(404, { code: "USER_NOT_FOUND", message: "no such user" }),
    );
    const client = build({ fetch });
    const error = await client.users.get("u1").then(
      () => {
        throw new Error("expected rejection");
      },
      (thrown: unknown) => thrown as NotFoundError,
    );
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.status).toBe(404);
    expect(error.code).toBe("USER_NOT_FOUND");
    expect(error.message).toBe("no such user");
    expect(error.method).toBe("get");
    expect(error.path).toBe("/users/{user_id}");
  });

  it("normalizes a thrown fetch into a NetworkError", async () => {
    const failing = (): Promise<Response> => {
      throw new TypeError("fetch failed");
    };
    const client = build({ fetch: failing });
    await expect(client.users.list()).rejects.toBeInstanceOf(NetworkError);
  });

  it("makes a single attempt per invocation", async () => {
    const { fetch, requests } = makeFetch(() => jsonResponse(503, {}));
    const client = build({ fetch });
    await expect(client.users.list()).rejects.toBeInstanceOf(ServerError);
    expect(requests).toHaveLength(1);
  });

  it("composes with call wrappers through .with", async () => {
    const { fetch, requests } = makeFetch((_request, attempt) =>
      attempt < 3 ? jsonResponse(503, {}) : jsonResponse(200, []),
    );
    const client = build({ fetch });
    const listWithRetry = client.users.list.with(retry({ backoffMs: 1 }));
    await expect(listWithRetry()).resolves.toEqual([]);
    expect(requests).toHaveLength(3);
  });

  it("fires the hooks around each transport attempt", async () => {
    const events: string[] = [];
    const { fetch } = makeFetch(() =>
      jsonResponse(503, { code: "UNAVAILABLE", message: "down" }),
    );
    const client = build({
      fetch,
      hooks: {
        onRequest: ({ method, path }) => {
          events.push(`req ${method} ${path}`);
        },
        onResponse: ({ response }) => {
          events.push(`res ${response.status}`);
        },
        onError: ({ error }) => {
          events.push(`err ${error.name}`);
        },
      },
    });
    await expect(
      client.users.list.with(retry({ attempts: 1, backoffMs: 1 }))(),
    ).rejects.toBeInstanceOf(ServerError);
    expect(events).toEqual([
      "req GET /users",
      "res 503",
      "err ServerError",
      "req GET /users",
      "res 503",
      "err ServerError",
    ]);
  });

  it("throws the mapped error when mapError returns one", async () => {
    const { fetch } = makeFetch(() => jsonResponse(500, {}));
    const client = build({
      fetch,
      mapError: (error) => new Error(`mapped ${error.name}`),
    });
    await expect(client.users.list()).rejects.toThrow("mapped ServerError");
  });

  it("throws the original error when mapError returns undefined", async () => {
    const { fetch } = makeFetch(() => jsonResponse(500, {}));
    const client = build({ fetch, mapError: () => undefined });
    await expect(client.users.list()).rejects.toBeInstanceOf(ServerError);
  });
});

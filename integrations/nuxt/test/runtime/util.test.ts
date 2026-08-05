import type { ClientConfig } from "openapi-press";
import { beforeEach, describe, expect, it } from "vitest";

import { mergeConfig, resolveConfig } from "../../src/runtime/util";
import { useRequestHeaders, useRuntimeConfig } from "../stubs/imports";

/** Flip the build-time `import.meta.server` flag the config resolution branches on. */
const asServer = (server: boolean): void => {
  (globalThis as Record<string, unknown>).__pressServer__ = server;
};

beforeEach(() => {
  useRuntimeConfig.mockReset();
  useRequestHeaders.mockReset();
  asServer(false);
});

describe("resolveConfig", () => {
  it("throws when the named client is not configured", () => {
    useRuntimeConfig.mockReturnValue({
      public: { press: { clients: {} } },
    });
    expect(() => resolveConfig("api")).toThrow(/no client named "api"/);
  });

  it("resolves the proxy prefix as the baseUrl on the client", () => {
    useRuntimeConfig.mockReturnValue({
      public: { press: { clients: { api: { prefix: "/api/core" } } } },
    });
    expect(resolveConfig("api")).toEqual({ baseUrl: "/api/core" });
  });

  describe("on the server", () => {
    beforeEach(() => {
      asServer(true);
    });

    it("throws when the client has no upstream host", () => {
      useRuntimeConfig.mockReturnValue({
        public: { press: { clients: { api: { prefix: "/api/core" } } } },
        press: { clients: {} },
      });
      expect(() => resolveConfig("api")).toThrow(/no upstream host/);
    });

    it("points at the host and forwards the caller's credentials", () => {
      useRuntimeConfig.mockReturnValue({
        public: { press: { clients: { api: { prefix: "/api/core" } } } },
        press: { clients: { api: { host: "https://api.internal" } } },
      });
      useRequestHeaders.mockReturnValue({
        cookie: "sid=1",
        authorization: "Bearer t",
      });
      expect(resolveConfig("api")).toEqual({
        baseUrl: "https://api.internal",
        headers: { cookie: "sid=1", authorization: "Bearer t" },
      });
    });

    it("drops forwarded headers the request did not carry", () => {
      useRuntimeConfig.mockReturnValue({
        public: { press: { clients: { api: { prefix: "/api/core" } } } },
        press: { clients: { api: { host: "https://api.internal" } } },
      });
      useRequestHeaders.mockReturnValue({
        cookie: "sid=1",
        authorization: undefined,
      });
      expect(resolveConfig("api")).toEqual({
        baseUrl: "https://api.internal",
        headers: { cookie: "sid=1" },
      });
    });
  });
});

describe("mergeConfig", () => {
  it("lets the override win on scalar fields", () => {
    expect(mergeConfig({ baseUrl: "a" }, { baseUrl: "b" })).toEqual({
      baseUrl: "b",
    });
  });

  it("keeps the base fields the override omits", () => {
    const base: ClientConfig = { baseUrl: "a", headers: { cookie: "sid=1" } };
    expect(mergeConfig(base, {})).toEqual(base);
  });

  it("merges headers so forwarded credentials survive caller headers", () => {
    const merged = mergeConfig(
      { baseUrl: "a", headers: { cookie: "sid=1" } },
      { headers: { "x-trace": "9" } },
    );
    const headers = new Headers(merged.headers);
    expect(headers.get("cookie")).toBe("sid=1");
    expect(headers.get("x-trace")).toBe("9");
  });

  it("lets a caller header override a base header of the same name", () => {
    const merged = mergeConfig(
      { headers: { "x-env": "prod" } },
      { headers: { "x-env": "canary" } },
    );
    expect(new Headers(merged.headers).get("x-env")).toBe("canary");
  });

  it("uses the override headers alone when the base carries none", () => {
    const merged = mergeConfig(
      { baseUrl: "a" },
      { headers: { "x-only": "1" } },
    );
    expect(merged.headers).toEqual({ "x-only": "1" });
  });
});

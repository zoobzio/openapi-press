import { describe, expect, it } from "vitest";

import {
  matchClient,
  normalizeClients,
  normalizeHost,
  normalizePrefix,
  proxyTarget,
} from "../src/util";

describe("normalizeHost", () => {
  it("strips trailing slashes", () => {
    expect(normalizeHost("https://api.test/")).toBe("https://api.test");
    expect(normalizeHost("https://api.test//")).toBe("https://api.test");
    expect(normalizeHost("https://api.test")).toBe("https://api.test");
  });
});

describe("normalizePrefix", () => {
  it("strips trailing slashes", () => {
    expect(normalizePrefix("/api/core/")).toBe("/api/core");
    expect(normalizePrefix("/api/core")).toBe("/api/core");
  });
});

describe("normalizeClients", () => {
  it("normalizes hosts and prefixes", () => {
    expect(
      normalizeClients({
        api: {
          client: "~/shared/api",
          host: "https://api.test/",
          prefix: "/api/core/",
        },
      }),
    ).toEqual({
      api: {
        client: "~/shared/api",
        host: "https://api.test",
        prefix: "/api/core",
      },
    });
  });

  it("rejects a missing client path", () => {
    expect(() =>
      normalizeClients({
        api: { client: "", host: "https://api.test", prefix: "/api" },
      }),
    ).toThrow('client "api" must point at a module');
  });

  it("rejects a relative host", () => {
    expect(() =>
      normalizeClients({
        api: { client: "~/shared/api", host: "api.test", prefix: "/api" },
      }),
    ).toThrow('client "api" host');
  });

  it("rejects an unrooted prefix", () => {
    expect(() =>
      normalizeClients({
        api: {
          client: "~/shared/api",
          host: "https://api.test",
          prefix: "api",
        },
      }),
    ).toThrow('client "api" prefix');
  });
});

describe("matchClient", () => {
  const clients = {
    api: { prefix: "/api/core" },
    billing: { prefix: "/api/billing" },
    nested: { prefix: "/api/core/nested" },
  };

  it("matches the prefix itself and paths under it", () => {
    expect(matchClient("/api/core", clients)?.name).toBe("api");
    expect(matchClient("/api/core/users/u1", clients)?.name).toBe("api");
    expect(matchClient("/api/billing/invoices", clients)?.name).toBe("billing");
  });

  it("matches through a query string", () => {
    expect(matchClient("/api/core?limit=5", clients)?.name).toBe("api");
    expect(matchClient("/api/core/users?limit=5", clients)?.name).toBe("api");
  });

  it("prefers the longest prefix when prefixes nest", () => {
    expect(matchClient("/api/core/nested/x", clients)?.name).toBe("nested");
  });

  it("refuses partial segment matches and unknown paths", () => {
    expect(matchClient("/api/corex", clients)).toBeNull();
    expect(matchClient("/other", clients)).toBeNull();
  });
});

describe("proxyTarget", () => {
  it("joins the host with the path remainder", () => {
    expect(
      proxyTarget("https://api.test", "/api/core", "/api/core/users/u1"),
    ).toBe("https://api.test/users/u1");
  });

  it("keeps the query string", () => {
    expect(
      proxyTarget("https://api.test", "/api/core", "/api/core/users?limit=5"),
    ).toBe("https://api.test/users?limit=5");
  });

  it("resolves the bare prefix to the host root", () => {
    expect(proxyTarget("https://api.test", "/api/core", "/api/core")).toBe(
      "https://api.test",
    );
  });
});

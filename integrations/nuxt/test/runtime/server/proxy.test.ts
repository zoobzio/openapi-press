import { beforeEach, describe, expect, it, vi } from "vitest";

const { proxyRequest } = vi.hoisted(() => ({
  proxyRequest: vi.fn((_event: unknown, target: string) => ({
    proxied: target,
  })),
}));

vi.mock("h3", () => ({
  defineEventHandler: (fn: unknown) => fn,
  createError: (opts: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(opts.statusMessage), opts),
  proxyRequest,
}));

import handler from "../../../src/runtime/server/proxy";
import { useRuntimeConfig } from "../../stubs/imports";

const invoke = handler as unknown as (event: { path: string }) => unknown;
const event = { path: "/api/core/users?limit=5" };

beforeEach(() => {
  useRuntimeConfig.mockReset();
  proxyRequest.mockClear();
});

describe("proxy handler", () => {
  it("404s when no client is mounted at the request path", () => {
    // No public plane at all: the handler falls back to an empty registry.
    useRuntimeConfig.mockReturnValue({ public: {} });
    expect(() => invoke(event)).toThrow(/No openforge client mounted/);
  });

  it("502s when the matched client has no upstream host", () => {
    useRuntimeConfig.mockReturnValue({
      public: { openforge: { clients: { api: { prefix: "/api/core" } } } },
      openforge: { clients: {} },
    });
    expect(() => invoke(event)).toThrow(/No upstream host/);
  });

  it("forwards to host + path-minus-prefix, passing the event through", () => {
    useRuntimeConfig.mockReturnValue({
      public: { openforge: { clients: { api: { prefix: "/api/core" } } } },
      openforge: { clients: { api: { host: "https://api.internal" } } },
    });

    const result = invoke(event);

    expect(useRuntimeConfig).toHaveBeenCalledWith(event);
    expect(proxyRequest).toHaveBeenCalledWith(
      event,
      "https://api.internal/users?limit=5",
    );
    expect(result).toEqual({ proxied: "https://api.internal/users?limit=5" });
  });

  it("routes to the longest matching prefix when clients nest", () => {
    useRuntimeConfig.mockReturnValue({
      public: {
        openforge: {
          clients: {
            api: { prefix: "/api" },
            core: { prefix: "/api/core" },
          },
        },
      },
      openforge: {
        clients: {
          api: { host: "https://api.internal" },
          core: { host: "https://core.internal" },
        },
      },
    });

    invoke(event);

    expect(proxyRequest).toHaveBeenCalledWith(
      event,
      "https://core.internal/users?limit=5",
    );
  });
});

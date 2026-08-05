import type { ClientConfig } from "openapi-press";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/runtime/util", () => ({
  resolveConfig: vi.fn(() => ({ baseUrl: "/api/core" })),
  mergeConfig: vi.fn((base: ClientConfig, override: ClientConfig) => ({
    ...base,
    ...override,
  })),
}));

import { usePress } from "../../src/runtime/composable";
import { mergeConfig, resolveConfig } from "../../src/runtime/util";
import { clients } from "../stubs/build-openapi-press";

// The generated manifest declares the registered names; stand one in so the
// composable's `name` argument and return type resolve.
declare module "#build/types/openapi-press" {
  interface PressClients {
    api: { list: () => void };
  }
}

const built = { list: () => {} };

beforeEach(() => {
  for (const key of Object.keys(clients)) delete clients[key];
  vi.mocked(resolveConfig).mockClear();
  vi.mocked(mergeConfig).mockClear();
});

describe("usePress", () => {
  it("builds the named client from resolved config under caller wiring", () => {
    const factory = vi.fn(() => built);
    clients.api = factory;
    const config: ClientConfig = {
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    };

    const client = usePress("api", config);

    expect(resolveConfig).toHaveBeenCalledWith("api");
    expect(mergeConfig).toHaveBeenCalledWith({ baseUrl: "/api/core" }, config);
    expect(factory).toHaveBeenCalledWith({ baseUrl: "/api/core", ...config });
    expect(client).toBe(built);
  });

  it("defaults the caller config to an empty object", () => {
    clients.api = vi.fn(() => built);

    usePress("api");

    expect(mergeConfig).toHaveBeenCalledWith({ baseUrl: "/api/core" }, {});
  });
});

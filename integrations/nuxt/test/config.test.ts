import { describe, expect, it } from "vitest";

import { defineOpenforgeConfig } from "../src/config";

describe("defineOpenforgeConfig", () => {
  it("returns the config it was given", () => {
    const config = {
      clients: {
        api: {
          client: "~/shared/api",
          host: "https://api.test",
          prefix: "/api/core",
        },
      },
    };
    expect(defineOpenforgeConfig(config)).toBe(config);
  });
});

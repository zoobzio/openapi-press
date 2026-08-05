import { describe, expect, it } from "vitest";

import { definePressConfig } from "../src/config";

describe("definePressConfig", () => {
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
    expect(definePressConfig(config)).toBe(config);
  });
});

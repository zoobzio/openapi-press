import { describe, expectTypeOf, it } from "vitest";

import type {
  PressClientConfig,
  HostPlane,
  MatchedClient,
  NuxtPressConfig,
  PrefixPlane,
} from "../src/types";

describe("PressClientConfig", () => {
  it("names the module, its upstream host, and its proxy prefix", () => {
    expectTypeOf<PressClientConfig>().toEqualTypeOf<{
      client: string;
      host: string;
      prefix: string;
    }>();
  });
});

describe("NuxtPressConfig", () => {
  it("carries an optional map of named clients", () => {
    expectTypeOf<NuxtPressConfig["clients"]>().toEqualTypeOf<
      Record<string, PressClientConfig> | undefined
    >();
  });
});

describe("MatchedClient", () => {
  it("is the name and prefix a request path resolved to", () => {
    expectTypeOf<MatchedClient>().toEqualTypeOf<{
      name: string;
      prefix: string;
    }>();
  });
});

describe("runtime-config planes", () => {
  it("keep hosts private and prefixes public", () => {
    expectTypeOf<HostPlane["clients"]>().toEqualTypeOf<
      Record<string, { host: string }> | undefined
    >();
    expectTypeOf<PrefixPlane["clients"]>().toEqualTypeOf<
      Record<string, { prefix: string }> | undefined
    >();
  });
});

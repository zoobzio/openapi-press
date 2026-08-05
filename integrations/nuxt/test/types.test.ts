import { describe, expectTypeOf, it } from "vitest";

import type {
  ForgeClientConfig,
  HostPlane,
  MatchedClient,
  NuxtOpenforgeConfig,
  PrefixPlane,
} from "../src/types";

describe("ForgeClientConfig", () => {
  it("names the module, its upstream host, and its proxy prefix", () => {
    expectTypeOf<ForgeClientConfig>().toEqualTypeOf<{
      client: string;
      host: string;
      prefix: string;
    }>();
  });
});

describe("NuxtOpenforgeConfig", () => {
  it("carries an optional map of named clients", () => {
    expectTypeOf<NuxtOpenforgeConfig["clients"]>().toEqualTypeOf<
      Record<string, ForgeClientConfig> | undefined
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

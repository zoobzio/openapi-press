import { beforeEach, describe, expect, it, vi } from "vitest";

// The setup runs entirely through @nuxt/kit; mock it so the test observes the
// wiring (config planes, proxy mounts, templates, auto-import) instead of
// standing up a real Nuxt.
const kit = vi.hoisted(() => ({
  addImports: vi.fn(),
  addServerHandler: vi.fn(),
  addTemplate: vi.fn(),
  addTypeTemplate: vi.fn(),
  createResolver: vi.fn(() => ({
    resolve: (path: string) => `/resolved${path.slice(1)}`,
  })),
  defineNuxtModule: (definition: unknown) => definition,
  resolvePath: vi.fn(async () => "/app/shared/api.ts"),
}));

vi.mock("@nuxt/kit", () => kit);

import moduleDefault from "../src/module";

interface NuxtStub {
  options: {
    srcDir: string;
    alias: Record<string, string>;
    vite: { ssr?: { external?: unknown } };
    nitro: { externals?: { external?: unknown[] } };
    runtimeConfig: Record<string, unknown> & {
      public: Record<string, unknown>;
    };
  };
}

const setup = (
  moduleDefault as unknown as {
    setup: (options: unknown, nuxt: NuxtStub) => Promise<void>;
  }
).setup;

const makeNuxt = (): NuxtStub => ({
  options: {
    srcDir: "/app",
    alias: {},
    vite: {},
    nitro: {},
    runtimeConfig: { public: {} },
  },
});

const options = {
  clients: {
    api: {
      client: "~/shared/api",
      host: "https://api.internal",
      prefix: "/api/core",
    },
  },
};

const FAMILY = [
  "openapi-press",
  "@openapi-press/spec",
  "@openapi-press/error",
  "@openapi-press/call",
  "@openapi-press/client",
];

const template = (
  calls: { filename: string; getContents: () => string }[],
  filename: string,
): { filename: string; getContents: () => string } => {
  const found = calls.find((tpl) => tpl.filename === filename);
  if (!found) throw new Error(`template "${filename}" was not registered`);
  return found;
};

beforeEach(() => {
  kit.addImports.mockClear();
  kit.addServerHandler.mockClear();
  kit.addTemplate.mockClear();
  kit.addTypeTemplate.mockClear();
});

describe("module setup", () => {
  it("splits hosts (private) and prefixes (public) across the runtime-config planes", async () => {
    const nuxt = makeNuxt();
    await setup(options, nuxt);
    expect(nuxt.options.runtimeConfig.press).toEqual({
      clients: { api: { host: "https://api.internal" } },
    });
    expect(nuxt.options.runtimeConfig.public.press).toEqual({
      clients: { api: { prefix: "/api/core" } },
    });
  });

  it("externalizes the openapi-press family on both server graphs", async () => {
    const nuxt = makeNuxt();
    await setup(options, nuxt);
    expect(nuxt.options.vite.ssr?.external).toEqual(
      expect.arrayContaining(FAMILY),
    );
    expect(nuxt.options.nitro.externals?.external).toEqual(
      expect.arrayContaining(FAMILY),
    );
  });

  it("appends to pre-existing server externals instead of replacing them", async () => {
    const nuxt = makeNuxt();
    nuxt.options.vite = { ssr: { external: ["existing-ssr"] } };
    nuxt.options.nitro = { externals: { external: ["existing-nitro"] } };
    await setup(options, nuxt);
    expect(nuxt.options.vite.ssr?.external).toEqual([
      "existing-ssr",
      ...FAMILY,
    ]);
    expect(nuxt.options.nitro.externals?.external).toEqual([
      "existing-nitro",
      ...FAMILY,
    ]);
  });

  it("mounts one proxy handler per client under its prefix", async () => {
    await setup(options, makeNuxt());
    expect(kit.addServerHandler).toHaveBeenCalledTimes(1);
    expect(kit.addServerHandler).toHaveBeenCalledWith({
      route: "/api/core/**",
      handler: "/resolved/runtime/server/proxy",
    });
  });

  it("registers the usePress auto-import from the composable", async () => {
    await setup(options, makeNuxt());
    expect(kit.addImports).toHaveBeenCalledWith({
      name: "usePress",
      from: "/resolved/runtime/composable",
    });
  });

  it("writes the runtime manifest importing each client factory by path", async () => {
    await setup(options, makeNuxt());
    const calls = kit.addTemplate.mock.calls.map(
      (call) => call[0] as { filename: string; getContents: () => string },
    );
    const contents = template(calls, "openapi-press.mjs").getContents();
    expect(contents).toContain('import c0 from "/app/shared/api.ts";');
    expect(contents).toContain('export const clients = { "api": c0 };');

    const types = template(calls, "openapi-press.d.mts").getContents();
    expect(types).toContain('import type c0 from "/app/shared/api";');
    expect(types).toContain('"api": typeof c0');
  });

  it("writes the client-type manifest deriving PressClients from each factory", async () => {
    await setup(options, makeNuxt());
    const call = kit.addTypeTemplate.mock.calls[0]?.[0] as
      { filename: string; getContents: () => string } | undefined;
    if (!call) throw new Error("type template was not registered");
    expect(call.filename).toBe("types/openapi-press.d.ts");
    const contents = call.getContents();
    expect(contents).toContain('import type c0 from "/app/shared/api";');
    expect(contents).toContain('"api": ReturnType<typeof c0>;');
    expect(contents).toContain(
      "export type PressClientName = keyof PressClients;",
    );
  });

  it("no-ops the client wiring when no clients are configured", async () => {
    const nuxt = makeNuxt();
    await setup({}, nuxt);
    expect(kit.addServerHandler).not.toHaveBeenCalled();
    expect(nuxt.options.runtimeConfig.press).toEqual({ clients: {} });
  });

  it("validates client config, rejecting a non-absolute host", async () => {
    await expect(
      setup(
        {
          clients: {
            api: { client: "~/x", host: "api.internal", prefix: "/x" },
          },
        },
        makeNuxt(),
      ),
    ).rejects.toThrow(/host must be an absolute/);
  });
});

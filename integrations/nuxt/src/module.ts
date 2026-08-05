/**
 * Nuxt module for openapi-press.
 *
 * The module makes user-built clients usable; it never builds one. Each named
 * client in `press.clients` points at a module whose default export is a
 * `Press` factory. Setup resolves those paths, splits host (private) and
 * prefix (public) across the runtime-config planes, mounts a proxy per
 * prefix, and writes the client registry into build templates: a manifest
 * `usePress` imports the factories through, and a type manifest deriving the
 * name union and each client's type. The composable builds on demand — there
 * is no plugin and nothing on the nuxt context.
 */

import {
  addImports,
  addServerHandler,
  addTemplate,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
  resolvePath,
} from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";

import { KEY } from "./constant";
import type { NuxtPressConfig } from "./types";
import { normalizeClients } from "./util";

/** A registry row: everything the templates need to emit one client. */
interface Entry {
  name: string;
  host: string;
  prefix: string;
  /** Absolute path to the user's Press module. */
  path: string;
  /** The same path without extension, importable from a declaration file. */
  typePath: string;
}

const module: NuxtModule<NuxtPressConfig> = defineNuxtModule<NuxtPressConfig>({
  meta: {
    name: "openapi-press",
    configKey: KEY,
  },
  setup: async (options, nuxt) => {
    const resolver = createResolver(import.meta.url);
    const clients = normalizeClients(options.clients ?? {});

    /*
     * Every part of the server — user SDKs pulled in through the build
     * manifest, app code catching errors — must share one copy
     * of the openapi-press modules, or `instanceof` breaks across the
     * vite/nitro bundling boundary. Externalizing the family on the server
     * side keeps it out of every bundle: both graphs resolve it at runtime
     * through node's module cache, which is one copy by construction.
     */
    const family = [
      "openapi-press",
      "@openapi-press/spec",
      "@openapi-press/error",
      "@openapi-press/call",
      "@openapi-press/client",
    ];
    nuxt.options.vite.ssr ||= {};
    if (Array.isArray(nuxt.options.vite.ssr.external)) {
      nuxt.options.vite.ssr.external.push(...family);
    } else {
      nuxt.options.vite.ssr.external = [...family];
    }
    nuxt.options.nitro.externals ||= {};
    (nuxt.options.nitro.externals.external ||= []).push(...family);

    const entries: Entry[] = await Promise.all(
      Object.entries(clients).map(async ([name, client]) => {
        const path = await resolvePath(client.client, {
          cwd: nuxt.options.srcDir,
          alias: nuxt.options.alias,
        });
        return {
          name,
          host: client.host,
          prefix: client.prefix,
          path,
          typePath: path.replace(/\.[cm]?[jt]sx?$/, ""),
        };
      }),
    );

    /*
     * Hosts are secrets of the server plane; prefixes are what the browser
     * dials. Splitting them across the runtime-config planes is what keeps
     * the upstream topology out of the client bundle.
     */
    const hosts: Record<string, { host: string }> = {};
    const prefixes: Record<string, { prefix: string }> = {};
    for (const entry of entries) {
      hosts[entry.name] = { host: entry.host };
      prefixes[entry.name] = { prefix: entry.prefix };
    }
    nuxt.options.runtimeConfig[KEY] = { clients: hosts };
    nuxt.options.runtimeConfig.public[KEY] = { clients: prefixes };

    /*
     * One proxy mount per client. The handler is generic — it re-derives
     * the matched client from runtime config at request time, so a
     * deploy-time host override needs no rebuild.
     */
    for (const entry of entries) {
      addServerHandler({
        route: `${entry.prefix}/**`,
        handler: resolver.resolve("./runtime/server/proxy"),
      });
    }

    /*
     * The manifest: `usePress` imports every Press through this single
     * module, so user clients stay app code compiled by the app bundler.
     */
    addTemplate({
      filename: "openapi-press.mjs",
      write: true,
      getContents: () =>
        [
          ...entries.map(
            (entry, i) => `import c${i} from ${JSON.stringify(entry.path)};`,
          ),
          `export const clients = { ${entries
            .map((entry, i) => `${JSON.stringify(entry.name)}: c${i}`)
            .join(", ")} };`,
        ].join("\n"),
    });

    addTemplate({
      filename: "openapi-press.d.mts",
      write: true,
      getContents: () =>
        [
          ...entries.map(
            (entry, i) =>
              `import type c${i} from ${JSON.stringify(entry.typePath)};`,
          ),
          `export declare const clients: { ${entries
            .map((entry, i) => `${JSON.stringify(entry.name)}: typeof c${i}`)
            .join("; ")} };`,
        ].join("\n"),
    });

    /*
     * The type manifest: each client's built type is derived from its
     * Press's return type, keyed by name for the composable's lookup.
     */
    addTypeTemplate({
      filename: "types/openapi-press.d.ts",
      write: true,
      getContents: () =>
        [
          ...entries.map(
            (entry, i) =>
              `import type c${i} from ${JSON.stringify(entry.typePath)};`,
          ),
          `export interface PressClients { ${entries
            .map(
              (entry, i) =>
                `${JSON.stringify(entry.name)}: ReturnType<typeof c${i}>;`,
            )
            .join(" ")} }`,
          `export type PressClientName = keyof PressClients;`,
          `declare module "nuxt/schema" { interface RuntimeConfig { ${KEY}: { clients: Record<PressClientName, { host: string }> } } interface PublicRuntimeConfig { ${KEY}: { clients: Record<PressClientName, { prefix: string }> } } }`,
          `export {};`,
        ].join("\n"),
    });

    addImports({
      name: "usePress",
      from: resolver.resolve("./runtime/composable"),
    });
  },
});

export default module;

/**
 * Nuxt module for openforge.
 *
 * The module makes user-built clients usable; it never builds one. Each named
 * client in `openforge.clients` points at a module whose default export is a
 * `Forge` factory. Setup resolves those paths, splits host (private) and
 * prefix (public) across the runtime-config planes, mounts a proxy per
 * prefix, and writes the client registry into build templates: a manifest
 * `useForge` imports the factories through, and a type manifest deriving the
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
import type { NuxtOpenforgeConfig } from "./types";
import { normalizeClients } from "./util";

/** A registry row: everything the templates need to emit one client. */
interface Entry {
  name: string;
  host: string;
  prefix: string;
  /** Absolute path to the user's Forge module. */
  path: string;
  /** The same path without extension, importable from a declaration file. */
  typePath: string;
}

const module: NuxtModule<NuxtOpenforgeConfig> =
  defineNuxtModule<NuxtOpenforgeConfig>({
    meta: {
      name: "openforge",
      configKey: KEY,
    },
    setup: async (options, nuxt) => {
      const resolver = createResolver(import.meta.url);
      const clients = normalizeClients(options.clients ?? {});

      /*
       * Every part of the server — user SDKs pulled in through the build
       * manifest, app code catching errors — must share one copy
       * of the openforge modules, or `instanceof` breaks across the
       * vite/nitro bundling boundary. Externalizing the family on the server
       * side keeps it out of every bundle: both graphs resolve it at runtime
       * through node's module cache, which is one copy by construction.
       */
      const family = [
        "openforge",
        "@openforge/spec",
        "@openforge/error",
        "@openforge/call",
        "@openforge/client",
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
       * The manifest: `useForge` imports every Forge through this single
       * module, so user clients stay app code compiled by the app bundler.
       */
      addTemplate({
        filename: "openforge.mjs",
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
        filename: "openforge.d.mts",
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
       * Forge's return type, keyed by name for the composable's lookup.
       */
      addTypeTemplate({
        filename: "types/openforge.d.ts",
        write: true,
        getContents: () =>
          [
            ...entries.map(
              (entry, i) =>
                `import type c${i} from ${JSON.stringify(entry.typePath)};`,
            ),
            `export interface ForgeClients { ${entries
              .map(
                (entry, i) =>
                  `${JSON.stringify(entry.name)}: ReturnType<typeof c${i}>;`,
              )
              .join(" ")} }`,
            `export type ForgeClientName = keyof ForgeClients;`,
            `declare module "nuxt/schema" { interface RuntimeConfig { ${KEY}: { clients: Record<ForgeClientName, { host: string }> } } interface PublicRuntimeConfig { ${KEY}: { clients: Record<ForgeClientName, { prefix: string }> } } }`,
            `export {};`,
          ].join("\n"),
      });

      addImports({
        name: "useForge",
        from: resolver.resolve("./runtime/composable"),
      });
    },
  });

export default module;

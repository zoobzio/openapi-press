# @openforge/nuxt

Nuxt module that makes openforge-built clients usable: typed clients on the
nuxt context, SSR-aware config, and a per-client API proxy.

## The model

Each named client points at a module whose default export is a `Forge` — the
config-accepting factory openforge produces. At build time the module
resolves those paths and generates a registry: a manifest the composable
imports the factories through, and a type manifest deriving the name union
and each client's type. `useForge(name)` builds on demand with
environment-appropriate config — names autocomplete, the client comes back
fully typed, no casts. There is no plugin and nothing on the nuxt context.

Config resolution is SSR-aware:

```
SSR:     Nuxt server ────────────────→ host   (+ cookie/authorization forwarded)
Client:  browser ──→ prefix (proxy) ──→ host
```

`host` lives in private runtime config (env-overridable via
`NUXT_OPENFORGE_CLIENTS_<NAME>_HOST`); the browser only ever sees `prefix`,
where a catch-all proxy forwards to the host.

## Usage

```ts
// shared/api.ts — plain openforge, default-exported Forge
import { defineForge } from "openforge";
import type { paths } from "./schema.gen";

const { op, client } = defineForge<paths>();

export default client({
  users: {
    list: op("get", "/users"),
    get: op("get", "/users/{user_id}"),
  },
});
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@openforge/nuxt"],
  openforge: {
    clients: {
      api: {
        client: "~/shared/api",
        host: "https://api.internal:8443",
        prefix: "/api/core",
      },
    },
  },
});
```

```vue
<script setup lang="ts">
const api = useForge("api"); // typed from your Forge's return type
const { data } = await useAsyncData("user", () =>
  api.users.get(route.params.id),
);
</script>
```

App wiring — logger, hooks, `mapError`, anything from `ClientConfig` — is
supplied at the call site and layered over the environment config (caller
wins; headers merge, so SSR credential forwarding survives):

```ts
const api = useForge("api", { logger, hooks: { onError: report } });

// Or as the app's own composable:
export const useApi = () => useForge("api", { logger });
```

Every call builds a fresh client (builds are cheap — wrap in your own
composable if sharing matters, e.g. for stateful `.with` wrappers).

## API

- `useForge(name, config?)` — auto-imported composable; builds the named
  client with caller wiring layered over the environment config. Typed via
  the generated registry.
- `openforge.clients` (nuxt.config) —
  `Record<name, { client, host, prefix }>`: the Forge module path, the
  upstream origin, and the proxy mount.
- `#build/types/openforge` — generated `ForgeClients` / `ForgeClientName`.
- `@openforge/nuxt/types` — the contract types.
- `@openforge/nuxt/config` — the `defineOpenforgeConfig` identity helper.
- `@openforge/nuxt/constant` — `KEY`, the module's config namespace.
- `@openforge/nuxt/util` — the pure plumbing (`normalizeClients`,
  `matchClient`, `proxyTarget`).

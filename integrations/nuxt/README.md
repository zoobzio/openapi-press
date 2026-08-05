# @openforge/nuxt

Nuxt module that makes openforge-built clients usable: typed clients on the
nuxt context, SSR-aware config, and a per-client API proxy.

## The model

Each named client points at a module whose default export is a `Forge` — the
config-accepting factory openforge produces. At build time the module
resolves those paths and generates a registry: a manifest the plugin imports
the factories through, and a type manifest deriving the name union and each
client's type. The plugin builds every client with environment-appropriate
config and provides the bundle on the nuxt app as `$forge`; `useForge(name)`
is a typed lookup into it — names autocomplete, the client comes back fully
typed, no casts. `nuxtApp.$forge.api` works directly too.

Config resolution is SSR-aware:

```
SSR:     Nuxt server ────────────────→ host   (+ cookie/authorization forwarded)
Client:  browser ──→ prefix (proxy) ──→ host
```

`host` lives in private runtime config (env-overridable via
`NUXT_OPENFORGE_CLIENTS_<NAME>_HOST`); the browser only ever sees `prefix`,
where a catch-all proxy forwards to the host. Clients are built once per app
instance — per browser session, per SSR request — so request-scoped headers
never leak across requests.

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

## API

- `useForge(name)` — auto-imported composable; returns the client from the
  `$forge` bundle, typed via the generated registry.
- `openforge.clients` (nuxt.config) —
  `Record<name, { client, host, prefix }>`: the Forge module path, the
  upstream origin, and the proxy mount.
- `#build/types/openforge` — generated `ForgeClients` / `ForgeClientName`.
- `@openforge/nuxt/types` — the contract types.
- `@openforge/nuxt/config` — the `defineOpenforgeConfig` identity helper.
- `@openforge/nuxt/constant` — `KEY`, the module's config namespace.
- `@openforge/nuxt/util` — the pure plumbing (`normalizeClients`,
  `matchClient`, `proxyTarget`).

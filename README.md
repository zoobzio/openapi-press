# openapi-press

A client-creation utility for resource-namespaced SDKs.

Start from the types [openapi-typescript](https://openapi-ts.dev) generates
for your API, describe the API as a nested namespace tree of operations, and
get back a fully-typed client — path params become positional arguments,
query and body optionality is inferred from the spec, and every failure
throws from a granular, HTTP-aware error hierarchy. Behavior (retry,
timeouts, caching, …) is opt-in per endpoint through a composable `.with`
combinator; nothing is instrumented by default.

> **Status:** early release. The API is usable but still settling — expect
> breaking changes between 0.x versions.

## Quick start

```sh
npm install openapi-press
npx openapi-typescript ./openapi.yaml -o ./schema.gen.ts
```

Describe the API once and export a **Press** — a config-accepting client
factory. The SDK owns the shape; whoever consumes it supplies the config:

```ts
// api.ts
import { definePress } from "openapi-press";
import type { paths } from "./schema.gen";

const { op, client } = definePress<paths>();

// Descriptors are checked against the spec: the path must exist and
// carry the method.
export const createApi = client({
  users: {
    list: op("get", "/users"),
    get: op("get", "/users/{user_id}"),
  },
});
```

Build it and call it — signatures are derived from the spec:

```ts
import { NotFoundError } from "openapi-press/error";
import { createApi } from "./api";

const api = createApi({ baseUrl: "https://api.example.com" });

const users = await api.users.list({ query: { limit: 20 } });

try {
  const user = await api.users.get("user-123");
} catch (error) {
  if (error instanceof NotFoundError) {
    // branch on class, not `status === 404`
  }
}
```

Endpoints that need behavior get it explicitly, through `.with`:

```ts
import { withRetry, withTimeout } from "openapi-press";

const retry = withRetry();
const getUser = api.users.get.with(retry, withTimeout(5000));
```

Wrappers compose positionally and extending the vocabulary is just writing a
function — see [`@openapi-press/call`](packages/call/README.md).

## Packages

The `openapi-press` umbrella re-exports the layers below; depend on it and the
decomposition stays an implementation detail. Each package documents its own
layer in depth.

| Package                                              | Purpose                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`openapi-press`](packages/openapi-press/README.md)  | Public umbrella — spec + call + client at the root, errors at `/error`        |
| [`@openapi-press/spec`](packages/spec/README.md)     | Typed interactions with a generated OpenAPI `paths` type                      |
| [`@openapi-press/error`](packages/error/README.md)   | Granular, HTTP-aware error hierarchy shared by every layer                    |
| [`@openapi-press/call`](packages/call/README.md)     | Instrumented callables — the `.with` combinator and wrappers (retry, timeout) |
| [`@openapi-press/client`](packages/client/README.md) | Wiring layer turning spec descriptors into live, typed API clients            |

### Integrations

| Package                                              | Purpose                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| [`@openapi-press/nuxt`](integrations/nuxt/README.md) | SSR-aware `usePress` composable and a per-client API proxy for Nuxt |

The Nuxt module registers Forges from `nuxt.config` and builds them with
environment-appropriate config: SSR calls the upstream host directly (with
credentials forwarded), the browser goes through a generated proxy so the
host never reaches the client. A working end-to-end app lives in
[`examples/nuxt`](examples/nuxt).

## Development

Requires Node (see `.nvmrc`) and pnpm (see `packageManager` in
`package.json`). `make help` lists the available targets; the common loop:

```sh
make install   # install workspace dependencies
make stub      # link packages to source for dev
make check     # lint + typecheck + test
```

`make ci` runs the full cold gate exactly as CI does: build first, then every
check.

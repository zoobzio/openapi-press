# @openapi-press/client

The wiring layer that turns spec descriptors into live, typed API clients.

## The client model

An openapi-press client is a nested namespace tree of `@openapi-press/spec`
descriptors bound to a transport. `defineClient<paths>()` binds the generated
spec type once; its `build(tree, config)` walks the tree, replacing each
descriptor leaf with an `@openapi-press/call` callable whose signature is derived
from the spec — positional path params, query/body optionality, and the
success payload type. Errors are never returned: every failure throws from
the `@openapi-press/error` hierarchy.

The client stays focused on wiring: each invocation is a single transport
attempt, observed by the hooks. Behavior — retry, timeouts, whatever an SDK
author decides an endpoint needs — is applied per endpoint through the
call's `.with` combinator; nothing is instrumented by default.

Configuration is two-tier. `ClientConfig` applies to every call a client
makes (base URL, fetch, headers, logger, hooks, error mapping); `CallConfig`
rides on an individual call's trailing options (`signal`, `headers`) and
wins on conflict.

## Usage

```ts
import { definePress } from "@openapi-press/client";
import type { paths } from "./schema.gen";

const { op, client } = definePress<paths>();

// A Press: minimal config in, usable client out. Export it — apps and
// integrations decide the config; the SDK owns the shape.
export const createApi = client({
  users: {
    list: op("get", "/users"),
    get: op("get", "/users/{user_id}"),
  },
});

const api = createApi({ baseUrl: "https://api.example.com" });
const user = await api.users.get("user-123");
```

The lower-level pieces remain available when a Press is not the right shape:
`defineSpec` + `defineClient().build(tree, config)` compose the same client
step by step, and endpoints can be instrumented per call site:

```ts
import { withRetry, withTimeout } from "@openapi-press/call";

const retry = withRetry();
const getUser = api.users.get.with(retry, withTimeout(5000));
```

## API

- `definePress<Paths>()` — the authoring kit: `op` for spec-checked
  descriptors, `client(tree)` to capture a tree into a `Press<T>` — the
  config-accepting client factory integrations consume.
- `defineClient<Paths>()` — binds a generated `paths` type; returns a
  `ClientBuilder` whose `build(tree, config?)` turns a descriptor tree into a
  typed client.
- `makeClient(tree, config?)` — binds a descriptor tree without the typed
  layer; the machine-facing counterpart to `defineClient`.
- `ClientConfig` / `CallConfig` — the two configuration tiers.
- `Hooks` — observe-only lifecycle hooks, firing around each transport
  attempt with the real `Request`/`Response`.
- `Bound<Paths, Tree>` / `BoundMethod<Paths, M, P>` / `CallOptions<Op>` /
  `OptionsArg<Op>` — the call-signature composition over the spec's derived
  types.

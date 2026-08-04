# @openforge/client

The wiring layer that turns spec descriptors into live, typed API clients.

## The client model

An openforge client is a nested namespace tree of `@openforge/spec`
descriptors bound to a transport. `defineClient<paths>()` binds the generated
spec type once; its `build(tree, config)` walks the tree, replacing each
descriptor leaf with an `@openforge/call` callable whose signature is derived
from the spec — positional path params, query/body optionality, and the
success payload type. Errors are never returned: every failure throws from
the `@openforge/error` hierarchy.

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
import { retry, timeout } from "@openforge/call";
import { defineClient } from "@openforge/client";
import type { ClientConfig } from "@openforge/client";
import { defineSpec } from "@openforge/spec";
import type { paths } from "./schema.gen";

const { op } = defineSpec<paths>();
const { build } = defineClient<paths>();

export const createClient = (config?: ClientConfig) => {
  const client = build(
    {
      users: {
        list: op("get", "/users"),
        get: op("get", "/users/{user_id}"),
      },
    },
    config,
  );
  // The SDK author decides which endpoints carry which behavior.
  return {
    users: {
      list: client.users.list.with(retry()),
      get: client.users.get.with(retry(), timeout(5000)),
    },
  };
};

const client = createClient({ baseUrl: "https://api.example.com" });
const user = await client.users.get("user-123");
```

## API

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

# @openforge/call

Instrumented callables for API clients.

## The call model

A call is an async function carrying its endpoint meta (`method`, `path`) and
a `.with` combinator. A wrapper is a signature-preserving transform of the
call's handler — `(next, meta) => handler`. That one contract gives the whole
pattern: `.with(...wrappers)` derives a new call with the wrappers applied
(the original is untouched), wrappers compose freely, and extending the
system means writing a function.

Composition order is positional: listed wrappers apply outside-in
(`with(a, b)` runs `a` around `b`), and a later `.with` wraps outside an
earlier one. Order matters — `timeout` outside `retry` bounds the whole
retried sequence; inside it, each attempt.

Nothing is instrumented by default. openforge ships the vocabulary; the SDK
author decides which endpoints carry which behavior.

## Usage

```ts
import { retry, timeout } from "@openforge/call";

// Instrument at SDK build time…
const getUser = client.users.get.with(retry(), timeout(5000));
const user = await getUser("user-123");

// …or write a wrapper of your own.
import type { Wrapper } from "@openforge/call";

const measure =
  (record: (ms: number) => void): Wrapper =>
  (next) =>
  async (...args) => {
    const start = performance.now();
    try {
      return await next(...args);
    } finally {
      record(performance.now() - start);
    }
  };
```

## API

- `defineCall(handler, meta)` — wraps a bare handler into a `Call` with
  `.with`.
- `retry(config?)` — retries failed attempts; defaults to idempotent reads
  (`GET`/`HEAD`) on transient errors (`ServerError` / `RateLimitError` /
  `NetworkError`), 2 retries, exponential backoff from 200ms. Every field is
  overridable, including the `on(error, meta)` predicate.
- `timeout(ms)` — bounds the call to a time budget, rejecting with
  `TimeoutError`. Does not cancel the underlying work.
- `isTransient(error)` — the default retry predicate, exported for reuse.
- `backoff(policy, retry)` — the exponential delay arithmetic.
- `DEFAULT_RETRY` — the built-in retry policy.
- `Call` / `Handler` / `Wrapper` / `CallMeta` / `RetryPolicy` — the contract
  types.

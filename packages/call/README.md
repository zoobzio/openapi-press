# @openapi-press/call

Instrumented callables for API clients.

## The call model

A call is an async function carrying its endpoint meta (`method`, `path`) and
a `.with` combinator. A wrapper is a signature-preserving transform of the
call's handler — `(next, meta) => handler`. That one contract gives the whole
pattern: `.with(...wrappers)` derives a new call with the wrappers applied
(the original is untouched), wrappers compose freely, and extending the
system means writing a function.

Wrapper factories are named `with*`; the suggested pattern is to name the
instance after the behavior and apply it through `.with`:

```ts
const retry = withRetry();
const breaker = withCircuitBreaker();

const getUser = client.users.get.with(retry, breaker);
```

Composition order is positional: listed wrappers apply outside-in
(`with(a, b)` runs `a` around `b`), and a later `.with` wraps outside an
earlier one. Order matters — `withTimeout` outside `withRetry` bounds the
whole retried sequence; inside it, each attempt.

Stateful wrappers keep their state in the factory's closure: one instance
applied to several endpoints shares state across them (one circuit for the
whole host); calling the factory per endpoint isolates it.

Nothing is instrumented by default. openapi-press ships the vocabulary; the SDK
author decides which endpoints carry which behavior.

## Usage

```ts
import {
  withCache,
  withReauth,
  withRetry,
  withTimeout,
} from "@openapi-press/call";

const retry = withRetry();
const reauth = withReauth(() => tokenStore.refresh());

export const users = {
  list: client.users.list.with(reauth, retry, withCache(30_000)),
  get: client.users.get.with(reauth, retry, withTimeout(5000)),
};

// Writing a wrapper of your own is just a function.
import type { Wrapper } from "@openapi-press/call";

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
- `withRetry(config?)` — retries failed attempts; defaults to idempotent
  reads (`GET`/`HEAD`) on transient errors, 2 retries, exponential backoff
  from 200ms. Every field is overridable, including the `on(error, meta)`
  predicate.
- `withTimeout(ms)` — bounds the call to a time budget, rejecting with
  `TimeoutError`. Does not cancel the underlying work.
- `withDedupe(key?)` — shares one in-flight promise among identical
  concurrent calls.
- `withCache(ttlMs, key?)` — memoizes successful results for a window;
  failures are never cached.
- `withCircuitBreaker(config?)` — fails fast with `CircuitOpenError` after
  consecutive counted failures; probes after the cooldown.
- `withFallback(fn)` — resolves with `fn(error, meta)` instead of throwing.
- `withReauth(refresh)` — on `UnauthorizedError`, runs `refresh` once and
  replays the call.
- `isTransient(error)` — the default retry/breaker predicate
  (`ServerError` / `RateLimitError` / `NetworkError`), exported for reuse.
- `backoff(policy, retry)` — the exponential delay arithmetic.
- `callKey(meta, args)` — the default invocation key for dedupe/cache.
- `DEFAULT_RETRY` / `DEFAULT_CIRCUIT_BREAKER` — the built-in policies.
- `Call` / `Handler` / `Wrapper` / `CallMeta` / `CallKey` / `RetryPolicy` /
  `CircuitBreakerPolicy` — the contract types.

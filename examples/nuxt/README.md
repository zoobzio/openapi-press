# @openapi-press/example-nuxt

The openapi-press Nuxt demo: a `Press` SDK in `shared/api.ts`, registered with
`@openapi-press/nuxt` as the "api" client, consumed through `usePress("api")`.

The upstream "API" is this same app's nitro server under `/upstream`, so the
whole round-trip is self-contained: SSR calls it directly as the host; the
browser calls the `/api/core` proxy, which forwards to it.

```sh
pnpm dev       # then open http://localhost:3000
```

- `shared/schema.gen.ts` — the `paths` type (hand-written here; a real app
  generates it with openapi-typescript)
- `shared/api.ts` — the SDK: `definePress` + namespace tree, default export
- `nuxt.config.ts` — the client registration: module path, host, prefix
- `server/routes/upstream/` — the mock upstream
- `app/app.vue` — typed calls, including class-based error handling

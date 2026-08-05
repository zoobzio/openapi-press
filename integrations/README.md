# integrations/

Bridges between openapi-press and external tooling or frameworks — codegen
pipelines, framework adapters, and the like. Same conventions as `packages/`;
the split is semantic: nothing in `packages/` may depend on anything here.

| Package               | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `@openapi-press/nuxt` | SSR-aware `usePress` composable and a per-client API proxy for Nuxt |

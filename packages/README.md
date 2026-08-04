# packages/

The openforge library itself. Each package here is publishable, ESM-only, and
built with unbuild to its own `.dist`.

| Package             | Purpose                                                                       |
| ------------------- | ----------------------------------------------------------------------------- |
| `@openforge/spec`   | Typed interactions with a generated OpenAPI `paths` type                      |
| `@openforge/error`  | Granular, HTTP-aware error hierarchy shared by every layer                    |
| `@openforge/call`   | Instrumented callables — the `.with` combinator and wrappers (retry, timeout) |
| `@openforge/client` | Wiring layer turning spec descriptors into live, typed API clients            |

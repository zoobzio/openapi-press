# packages/

The openapi-press library itself. Each package here is publishable, ESM-only, and
built with unbuild to its own `.dist`.

| Package                 | Purpose                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| `openapi-press`         | Public umbrella — spec + call + client at the root, errors at `/error`        |
| `@openapi-press/spec`   | Typed interactions with a generated OpenAPI `paths` type                      |
| `@openapi-press/error`  | Granular, HTTP-aware error hierarchy shared by every layer                    |
| `@openapi-press/call`   | Instrumented callables — the `.with` combinator and wrappers (retry, timeout) |
| `@openapi-press/client` | Wiring layer turning spec descriptors into live, typed API clients            |

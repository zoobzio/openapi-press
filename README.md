# openforge

A client-creation utility for resource-namespaced SDKs.

Define a spec once, describe your API as a nested namespace tree of
operations, and build a fully-typed client — path params become positional
arguments, query and body optionality is inferred, and errors are normalized.

> Early scaffolding — no packages published yet.

## Workspace

| Directory       | Purpose                                    |
| --------------- | ------------------------------------------ |
| `packages/`     | The openforge library packages             |
| `integrations/` | Bridges to external tooling and frameworks |

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

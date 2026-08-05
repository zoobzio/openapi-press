import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const fromHere = (path: string): string =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // The runtime files import Nuxt's virtual modules and self-reference the
  // package's own subpath exports. Point both at the source under test: the
  // virtual modules at test doubles, the subpaths at their src (not built .dist).
  resolve: {
    alias: {
      "@openapi-press/nuxt/constant": fromHere("./src/constant.ts"),
      "@openapi-press/nuxt/util": fromHere("./src/util.ts"),
      "#imports": fromHere("./test/stubs/imports.ts"),
      "#build/openapi-press.mjs": fromHere(
        "./test/stubs/build-openapi-press.ts",
      ),
    },
  },
  // Nuxt replaces `import.meta.server` at build; here it reads a global the
  // tests flip, so both the server and client resolution branches are reachable.
  define: {
    "import.meta.server": "globalThis.__pressServer__",
  },
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
    },
  },
});

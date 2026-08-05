import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "src/module",
    "src/config",
    "src/constant",
    "src/types",
    "src/util",
    // The runtime is shipped unbundled: Nuxt resolves these files by path and
    // compiles them in the app, where the #imports virtual exists.
    { input: "src/runtime/", outDir: ".dist/runtime", builder: "mkdist" },
  ],
  outDir: ".dist",
  declaration: true,
  externals: [
    "#imports",
    "#build/openforge.mjs",
    "#build/types/openforge",
    "@nuxt/kit",
    "@nuxt/schema",
    "nuxt",
    "h3",
    "openforge",
    "@openforge/nuxt/constant",
    "@openforge/nuxt/types",
    "@openforge/nuxt/util",
  ],
  rollup: {
    emitCJS: false,
  },
});

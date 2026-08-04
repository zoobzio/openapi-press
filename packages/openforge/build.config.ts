import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["src/index", "src/error"],
  outDir: ".dist",
  declaration: true,
  rollup: {
    emitCJS: false,
  },
});

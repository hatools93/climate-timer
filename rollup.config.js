import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/main.ts",
  output: {
    file: "dist/climate-timer-card.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: "./tsconfig.json",
      noEmit: false,
      declaration: false,
      declarationMap: false,
      sourceMap: false,
    }),
    terser(),
  ],
};

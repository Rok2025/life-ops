import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Note: eslint-plugin-tailwindcss is not used — it targets Tailwind v3 and
// fails with Tailwind v4 (resolveConfig export removed). Rely on design-system
// docs + Stylelint for token/arbitrary-value discipline until the plugin supports v4.

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

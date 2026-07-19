import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsdoc from "eslint-plugin-jsdoc";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  jsdoc.configs["flat/recommended-typescript-error"],
  {
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            ArrowFunctionExpression: false,
            ClassDeclaration: true,
            ClassExpression: false,
            FunctionDeclaration: true,
            FunctionExpression: false,
            MethodDefinition: true,
          },
        },
      ],
      "jsdoc/require-param-description": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/require-returns-check": "off",
      "jsdoc/require-param": "error",
      "jsdoc/require-returns": [
        "error",
        {
          enableFixer: true,
          forceRequireReturn: true,
          forceReturnsWithAsync: true,
          publicOnly: true,
        },
      ],
      "jsdoc/tag-lines": ["error", "any", { startLines: 1 }],
    },
  },
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "import/order": "off",
      "react/destructuring-assignment": [
        "error",
        "always",
        { destructureInSignature: "always" },
      ],
      "react/jsx-no-leaked-render": ["error", { validStrategies: ["ternary"] }],
      "react/jsx-sort-props": ["error", { ignoreCase: true }],
      "react/self-closing-comp": "error",
      "simple-import-sort/exports": "error",
      "simple-import-sort/imports": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "drizzle/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;

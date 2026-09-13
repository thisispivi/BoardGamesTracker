import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsdoc from "eslint-plugin-jsdoc";
import simpleImportSort from "eslint-plugin-simple-import-sort";

/** Message shared by every rule that forbids escaping a module with `../`. */
const relativeParentImports = {
  group: ["../*"],
  message: "Import through the @/ alias instead of a relative parent path.",
};

/** Prevents application entry points from becoming reusable dependencies. */
const appImports = {
  group: ["@/app", "@/app/**"],
  message:
    "Routes are entry points; move shared behavior to its owning module.",
};

/**
 * Type-aware rules that catch the promise mistakes review keeps missing.
 *
 * They need the TypeScript program, so they are scoped to `src` rather than
 * paid for on config and scripts that gain nothing from them.
 */
const promiseSafety = {
  "@typescript-eslint/await-thenable": "error",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": "error",
};

/** Atomic Design layers, outermost last. A layer may only import earlier ones. */
const componentLayers = ["atoms", "molecules", "organisms", "templates"];

/**
 * Builds one ESLint override per Atomic Design layer.
 *
 * The dependency direction is documented in CODING_GUIDELINES.md; expressing it
 * here is what actually stops an atom from reaching for an organism.
 */
const atomicDesignBoundaries = componentLayers.map((layer, index) => ({
  files: [`src/components/${layer}/**/*.tsx`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          relativeParentImports,
          appImports,
          ...componentLayers.slice(index + 1).map((outerLayer) => ({
            group: [`@/components/${outerLayer}/**`],
            message: `Atomic Design is one-way: ${layer} must not import ${outerLayer}.`,
          })),
        ],
      },
    ],
  },
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  jsdoc.configs["flat/recommended-typescript-error"],
  {
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          contexts: [
            "TSEnumDeclaration",
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
          ],
          publicOnly: false,
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
      "jsdoc/informative-docs": "error",
      "jsdoc/require-description": "error",
      "jsdoc/require-description-complete-sentence": "error",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/require-returns-check": "off",
      "jsdoc/require-param": "error",
      "jsdoc/require-returns": [
        "error",
        {
          checkConstructors: false,
          enableFixer: true,
          forceRequireReturn: true,
          forceReturnsWithAsync: true,
          publicOnly: false,
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
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...promiseSafety,
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "no-restricted-imports": [
        "error",
        { patterns: [relativeParentImports, appImports] },
      ],
    },
  },
  {
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            relativeParentImports,
            appImports,
            {
              group: [
                "@/server",
                "@/server/**",
                "@/client/**",
                "@/components/**",
                "@/hooks/**",
                "@/env",
                "react",
                "next",
                "next/**",
              ],
              message:
                "src/core holds framework-free contracts and must not depend on src/server.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/utils/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            relativeParentImports,
            appImports,
            {
              group: [
                "@/server",
                "@/server/**",
                "@/client/**",
                "@/components/**",
                "@/hooks/**",
                "@/env",
                "react",
                "next",
                "next/**",
                "server-only",
              ],
              message:
                "Utilities must stay isomorphic; put runtime-specific behavior in src/client or src/server.",
            },
          ],
        },
      ],
    },
  },
  ...atomicDesignBoundaries,
  {
    files: ["src/app/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [relativeParentImports] }],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "drizzle/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;

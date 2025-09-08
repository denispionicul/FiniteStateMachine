import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import robloxTs from "eslint-plugin-roblox-ts";
import prettier from "eslint-plugin-prettier";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["out"]), {
    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:roblox-ts/recommended",
        "plugin:prettier/recommended",
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        "roblox-ts": robloxTs,
        prettier,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2018,
        sourceType: "module",

        parserOptions: {
            jsx: true,
            useJSXTextNode: true,
            project: "./tsconfig.json",
        },
    },

    rules: {
        "prettier/prettier": "warn",
    },
}]);
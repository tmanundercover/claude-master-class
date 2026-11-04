import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default tseslint.config(
  { ignores: ["**/dist/**", "node_modules/**", "functions/public/**", ".firebase/**", "docs/slides/reveal.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }] },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    rules: { ...reactHooks.configs.recommended.rules, ...jsxA11y.configs.recommended.rules },
    settings: { "jsx-a11y": { components: { AppLink: "a" } } },
  },
  {
    files: ["docs/slides/presenter.js", "docs/slides/review.mjs"],
    languageOptions: { globals: { Reveal: "readonly" } },
  },
  {
    files: ["src/components/InterviewLibrary.tsx"],
    // Transcript and modal regions need keyboard focus for scrolling.
    rules: { "jsx-a11y/no-noninteractive-tabindex": "off" },
  },
  {
    files: ["src/components/InterviewLibrary.tsx", "src/components/RoleIntroduction.tsx"],
    // Recordings are optional and accompanied by approved visible transcripts.
    rules: { "jsx-a11y/media-has-caption": "off" },
  },
  {
    files: ["src/components/ResumeSearchFab.tsx"],
    // The native dialog handles Escape; this listener only dismisses backdrop clicks.
    rules: { "jsx-a11y/click-events-have-key-events": "off", "jsx-a11y/no-noninteractive-element-interactions": "off" },
  },
);

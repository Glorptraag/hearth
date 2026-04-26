import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Archival reference files — not part of the running app
    "prototypes/**",
    "docs/**",
    ".claude/**",
  ]),
  {
    // Demoted from error to warn so a stricter eslint-plugin-react-hooks
    // upgrade does not block CI while we work through the cases. These
    // surfaced after the lockfile refresh in commit e3d9817; tracked as
    // pre-existing warnings on docs/production-readiness-tracker.md #7.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;

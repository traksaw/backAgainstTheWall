import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([{
    extends: [...nextCoreWebVitals, ...nextTypescript],

    rules: {
        "react/no-unescaped-entities": "off",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
    },
}, {
    // WAS-44: API route catch blocks must report errors through
    // lib/server-error's reportServerError() - not raw console logging or a
    // direct Sentry call - so client responses stay generic and server-side
    // logging stays production-gated. Scoped to CatchClause specifically so
    // it doesn't flag unrelated success-path console usage (e.g. a debug log
    // gated behind isProductionEnvironment() outside of error handling).
    files: ["app/api/**/route.ts"],
    rules: {
        "no-restricted-syntax": ["error",
            {
                selector: "CatchClause CallExpression[callee.object.name='console'][callee.property.name=/^(log|warn|error|debug)$/]",
                message: "Don't call console directly in a route's catch block - call reportServerError() from lib/server-error instead.",
            },
            {
                selector: "CatchClause CallExpression[callee.object.name='Sentry'][callee.property.name='captureException']",
                message: "Don't call Sentry directly in a route's catch block - call reportServerError() from lib/server-error instead.",
            },
        ],
    },
}]);
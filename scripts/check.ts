// Runs every status check (typecheck, lint, format, test) sequentially.

import { spawnSync } from "node:child_process";
import { styleText } from "node:util";

interface Check {
  name: string;
  script: string;
  args?: string[];
}

interface CheckResult {
  name: string;
  ok: boolean;
}

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

const checks: Check[] = [
  { name: "typecheck", script: "typecheck" },
  { name: "lint", script: "lint:compact" },
  { name: "format", script: "format:check" },
  {
    name: "test",
    script: "test:compact",
    // Added here rather than in the Vitest config because the script's --reporter flag replaces the config's list.
    args: isGitHubActions ? ["--reporter=github-actions"] : [],
  },
];
const results: CheckResult[] = [];

for (const { name, script, args = [] } of checks) {
  console.log(`\n${styleText("bold", `▶ ${name}`)}`);
  const pnpmArgs = args.length > 0 ? [script, "--", ...args] : [script];
  const { status, error } = spawnSync("pnpm", ["--silent", ...pnpmArgs], { stdio: "inherit" });

  if (error) {
    const message = `Failed to run the ${name} check: ${error.message}`;
    console.error(styleText("red", message, { stream: process.stderr }));
  }

  const ok = status === 0;
  console.log(ok ? styleText("green", "✓ passed") : styleText("red", "✗ failed"));
  results.push({ name, ok });
}

const failed = results.filter((result) => !result.ok).map((result) => result.name);
if (failed.length > 0) {
  const heading = styleText("red", `${failed.length} of ${results.length} checks failed:`);
  console.log(`\n${heading} ${failed.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`\n${styleText("green", `All ${results.length} checks passed.`)}`);
}

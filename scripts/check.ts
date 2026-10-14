// Runs every status check (typecheck, lint, format, test) sequentially.

import { spawnSync } from "node:child_process";
import { styleText } from "node:util";

interface Check {
  name: string;
  script: string;
}

interface CheckResult {
  name: string;
  ok: boolean;
}

const checks: Check[] = [
  { name: "typecheck", script: "typecheck" },
  { name: "lint", script: "lint:compact" },
  { name: "format", script: "format:check" },
  { name: "test", script: "test" },
];
const results: CheckResult[] = [];

for (const { name, script } of checks) {
  console.log(`\n${styleText("bold", `▶ ${name}`)}`);
  const { status, error } = spawnSync("pnpm", ["--silent", script], { stdio: "inherit" });

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

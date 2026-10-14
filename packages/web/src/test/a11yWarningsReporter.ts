import { styleText } from "node:util";
import type { A11yReport } from "@storybook/addon-a11y";
import type { Reporter, TestCase } from "vitest/node";

interface StoryReport {
  type: string;
  status: "failed" | "passed" | "warning";
  result: unknown;
}

declare module "vitest" {
  interface TaskMeta {
    storyId?: string;
    reports?: StoryReport[];
  }
}

function isA11yResults(result: unknown): result is Extract<A11yReport, { violations: unknown }> {
  return typeof result === "object" && result !== null && "violations" in result;
}

/**
 * Prints the axe violations of stories that run with `a11y: { test: "todo" }`, which Storybook
 * records as warnings on the test instead of failing it.
 */
export default class A11yWarningsReporter implements Reporter {
  private readonly warnings: string[] = [];

  onTestCaseResult(testCase: TestCase) {
    const { storyId, reports } = testCase.meta();
    for (const { type, status, result } of reports ?? []) {
      if (type !== "a11y" || status !== "warning" || !isA11yResults(result)) {
        continue;
      }
      const violations = result.violations.map((v) => `${v.id} (${v.nodes.length})`);
      this.warnings.push(`${storyId ?? testCase.fullName}: ${violations.join(", ")}`);
    }
  }

  onTestRunEnd() {
    if (this.warnings.length === 0) {
      return;
    }
    const heading = `${this.warnings.length} stories have a11y violations marked as todo:`;
    console.warn(
      `\n${styleText("yellow", heading)}\n${this.warnings.map((w) => `  ${w}`).join("\n")}`,
    );
  }
}

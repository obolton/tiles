import { execFileSync } from "node:child_process";
import { findDevServerPids } from "./shared.ts";

function processGroup(pid: number): number | undefined {
  try {
    const output = execFileSync("ps", ["-o", "pgid=", "-p", String(pid)], { encoding: "utf8" });
    const pgid = Number.parseInt(output, 10);
    return Number.isInteger(pgid) ? pgid : undefined;
  } catch {
    return undefined;
  }
}

const pids = findDevServerPids();
if (pids.length === 0) {
  console.log("Dev server is not running.");
} else {
  const groups = new Set(pids.map(processGroup).filter((pgid) => pgid !== undefined));
  for (const pgid of groups) {
    try {
      process.kill(-pgid, "SIGTERM");
    } catch {
      // The group may already have exited
    }
  }
  console.log(`Stopped dev server (process group ${[...groups].join(", ")}).`);
}

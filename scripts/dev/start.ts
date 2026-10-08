import { spawn } from "node:child_process";
import { closeSync, existsSync, openSync, readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { LOG_FILE, findDevServerPids, isHealthy } from "./shared.ts";

const START_TIMEOUT_SECONDS = 90;
const STARTUP_GRACE_SECONDS = 3;

const APP_URL = process.env.PUBLIC_WEB_ORIGIN ?? "http://localhost:3000";

function printLogTail(lines: number) {
  if (existsSync(LOG_FILE)) {
    console.error(readFileSync(LOG_FILE, "utf8").trimEnd().split("\n").slice(-lines).join("\n"));
  }
}

function fail(message: string): never {
  console.error(`${message} Last log lines:`);
  printLogTail(40);
  process.exit(1);
}

if (await isHealthy()) {
  console.log(`Dev server already running at ${APP_URL}`);
} else {
  if (findDevServerPids().length > 0) {
    console.log("Dev server is starting; waiting...");
  } else {
    const log = openSync(LOG_FILE, "w");
    const child = spawn("pnpm", ["dev"], { detached: true, stdio: ["ignore", log, log] });
    closeSync(log);
    child.unref();
    console.log(`Starting dev server (logs: ${LOG_FILE})...`);
  }

  for (let waited = 0; !(await isHealthy()); waited++) {
    if (waited >= START_TIMEOUT_SECONDS) {
      fail("Timed out waiting for the dev server.");
    }
    if (waited >= STARTUP_GRACE_SECONDS && findDevServerPids().length === 0) {
      fail("The dev server exited during startup.");
    }
    await sleep(1000);
  }
  console.log(`Dev server ready at ${APP_URL}`);
}

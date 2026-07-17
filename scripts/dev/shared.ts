import { execFileSync } from "node:child_process";
import { createConnection } from "node:net";

const DEV_COMMAND_PATTERN = "pnpm -r --parallel dev";

export const LOG_FILE = "/tmp/tiles-dev.log";
export const SERVICE_PORTS = [3000, 3001, 3002];

function isPortListening(port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

export async function isHealthy() {
  const results = await Promise.all(SERVICE_PORTS.map(isPortListening));
  return results.every(Boolean);
}

export function findDevServerPids(): number[] {
  try {
    const output = execFileSync("pgrep", ["-f", DEV_COMMAND_PATTERN], { encoding: "utf8" });
    return output.split("\n").filter(Boolean).map(Number);
  } catch {
    // pgrep exits non-zero when nothing matches
    return [];
  }
}

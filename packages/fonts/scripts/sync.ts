import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { FONTS } from "@/config";
import { openFontBucket, type FontBucketSession } from "@/storage";
import { syncFonts, type FontProgress } from "@/sync";

const MANIFEST_PATH = join(import.meta.dirname, "../src/manifest.json");

const { values } = parseArgs({
  options: {
    env: { type: "string" },
  },
});

function logProgress(progress: FontProgress) {
  console.log(
    `  ${progress.id}: ${progress.files} files (${progress.uploaded} uploaded, ${progress.skipped} skipped)`,
  );
}

const environment = values.env ?? process.env.CLOUDFLARE_ENV;
console.log(
  `Syncing ${FONTS.length} fonts using the ${environment ? `"${environment}"` : "default"} Wrangler environment...`,
);

let session: FontBucketSession | undefined;

try {
  session = await openFontBucket(values.env);

  const { manifest, uploaded, skipped } = await syncFonts(session.bucket, FONTS, logProgress);

  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`\nSynced ${FONTS.length} fonts: ${uploaded} uploaded, ${skipped} skipped`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await session?.dispose();
}

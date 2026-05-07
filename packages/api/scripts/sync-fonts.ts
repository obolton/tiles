import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FONTS } from "@/config/fonts.ts";
import { FONTS_BUCKET } from "@/utils/storage";
import { syncFonts } from "./fonts/sync";

const MANIFEST_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/fonts/manifest.json",
);

console.log(`Syncing ${FONTS.length} fonts to bucket "${FONTS_BUCKET}"...`);

const { manifest, uploaded, skipped } = await syncFonts(FONTS, (progress) => {
  console.log(
    `  ${progress.id}: ${progress.variants} variants (${progress.uploaded} uploaded, ${progress.skipped} skipped)`,
  );
});

await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `\nSynced ${FONTS.length} fonts: ${uploaded} uploaded, ${skipped} skipped`,
);
console.log(`Manifest: ${MANIFEST_PATH}`);

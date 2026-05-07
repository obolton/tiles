import { FONTS_BUCKET, objectExists, upload } from "@/utils/storage";
import type { FontConfig } from "@/config/fonts";
import type {
  FontsManifest,
  ManifestFont,
  ManifestWeight,
} from "@/fonts/manifest";
import {
  getVariableFontUrl,
  fetchFontMetadata,
  fetchVariableFontMetadata,
  getFontFilename,
  type FontsourceFont,
} from "./fontsource";

const SUBSET = "latin";
const STYLES = ["normal", "italic"] as const;
const WOFF2_CONTENT_TYPE = "font/woff2";
const WOFF2_CACHE_CONTROL = "public, max-age=31536000, immutable";

interface VariantResult<W extends ManifestWeight> {
  file: { weight: W; style: string; subset: string; path: string };
  uploaded: boolean;
}

interface FontSyncResult {
  id: string;
  font: ManifestFont;
  uploaded: number;
  skipped: number;
}

export interface FontProgress {
  id: string;
  variants: number;
  uploaded: number;
  skipped: number;
}

function getSyncPath(fontId: string, filename: string): string {
  return `${fontId}/${fontId}-${filename}`;
}

async function syncFile(path: string, url: string): Promise<boolean> {
  if (await objectExists(FONTS_BUCKET, path)) {
    return false;
  }

  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  await upload(
    FONTS_BUCKET,
    path,
    response.body,
    WOFF2_CONTENT_TYPE,
    WOFF2_CACHE_CONTROL,
  );

  return true;
}

async function collectStaticVariants(
  font: FontConfig,
  meta: FontsourceFont,
): Promise<VariantResult<number>[]> {
  const targets: {
    weight: number;
    style: string;
    path: string;
    url: string;
  }[] = [];

  for (const weight of font.weights) {
    const byStyle = meta.variants[String(weight)];
    if (!byStyle) {
      continue;
    }

    for (const style of STYLES) {
      const url = byStyle[style]?.[SUBSET]?.url.woff2;
      if (!url) {
        continue;
      }

      const path = getSyncPath(font.id, getFontFilename(SUBSET, weight, style));
      targets.push({ weight, style, path, url });
    }
  }

  const variants = await Promise.all(
    targets.map(async ({ weight, style, path, url }) => ({
      file: { weight, style, subset: SUBSET, path },
      uploaded: await syncFile(path, url),
    })),
  );

  variants.sort(
    (a, b) =>
      a.file.weight - b.file.weight || a.file.style.localeCompare(b.file.style),
  );

  return variants;
}

async function collectVariableVariants(
  font: FontConfig,
  meta: FontsourceFont,
  weight: { min: number; max: number },
): Promise<VariantResult<{ min: number; max: number }>[]> {
  const styles = STYLES.filter((style) => meta.styles.includes(style));

  const variants = await Promise.all(
    styles.map(async (style) => {
      const path = getSyncPath(font.id, getFontFilename(SUBSET, "wght", style));
      const woff2Url = getVariableFontUrl(font.id, SUBSET, style);
      return {
        file: { weight, style, subset: SUBSET, path },
        uploaded: await syncFile(path, woff2Url),
      };
    }),
  );

  variants.sort((a, b) => a.file.style.localeCompare(b.file.style));

  return variants;
}

async function syncFont(font: FontConfig): Promise<FontSyncResult> {
  const [meta, variable] = await Promise.all([
    fetchFontMetadata(font.id),
    fetchVariableFontMetadata(font.id),
  ]);

  const wght = variable?.axes.wght;
  const variants = wght
    ? await collectVariableVariants(font, meta, {
        min: Number(wght.min),
        max: Number(wght.max),
      })
    : await collectStaticVariants(font, meta);

  const uploaded = variants.filter((r) => r.uploaded).length;
  const skipped = variants.length - uploaded;

  return {
    id: font.id,
    font: {
      family: meta.family,
      version: meta.version,
      files: variants.map((r) => r.file),
    },
    uploaded,
    skipped,
  };
}

export interface FontsSyncSummary {
  manifest: FontsManifest;
  uploaded: number;
  skipped: number;
}

export async function syncFonts(
  fonts: readonly FontConfig[],
  onProgress?: (progress: FontProgress) => void,
): Promise<FontsSyncSummary> {
  const results: FontSyncResult[] = [];

  for (const font of fonts) {
    const result = await syncFont(font);
    onProgress?.({
      id: result.id,
      variants: result.font.files.length,
      uploaded: result.uploaded,
      skipped: result.skipped,
    });
    results.push(result);
  }

  const manifest: FontsManifest = {
    syncedAt: new Date().toISOString(),
    fonts: Object.fromEntries(results.map((r) => [r.id, r.font])),
  };

  return {
    manifest,
    uploaded: results.reduce((sum, r) => sum + r.uploaded, 0),
    skipped: results.reduce((sum, r) => sum + r.skipped, 0),
  };
}

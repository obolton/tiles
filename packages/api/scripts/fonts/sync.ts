import subsetFont from "subset-font";
import { FONTS_BUCKET, objectExists, upload } from "@/utils/storage";
import type { FontConfig } from "@/config/fonts";
import { FontStyleSchema } from "@/fonts/manifest";
import type {
  FontsManifest,
  FontStyle,
  FontVariant,
  ManifestFont,
} from "@/fonts/manifest";
import {
  getFontUrl,
  fetchFontMetadata,
  fetchVariableFontMetadata,
  type FontsourceFont,
  type FontsourceVariableFont,
} from "./fontsource";

const SUBSET = "latin";
const STYLES = FontStyleSchema.options;
const WOFF2_CONTENT_TYPE = "font/woff2";
const WOFF2_CACHE_CONTROL = "public, max-age=31536000, immutable";

interface VariantResult {
  file: FontVariant;
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
  files: number;
  uploaded: number;
  skipped: number;
}

function getVariantPath(
  fontId: string,
  subset: string,
  weightOrAxis: number | "wght",
  style: FontStyle,
): string {
  return `${fontId}/${fontId}-${subset}-${weightOrAxis}-${style}.woff2`;
}

function getPreviewPath(fontId: string): string {
  return `${fontId}/${fontId}-preview.woff2`;
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

async function syncVariant(
  fontId: string,
  variant: FontVariant,
): Promise<VariantResult> {
  const slug = typeof variant.weight === "number" ? variant.weight : "wght";
  const url = getFontUrl(fontId, variant.subset, slug, variant.style);
  return {
    file: variant,
    uploaded: await syncFile(variant.path, url),
  };
}

async function collectStaticVariants(
  font: FontConfig,
  meta: FontsourceFont,
): Promise<VariantResult[]> {
  const targets: FontVariant[] = [];

  for (const weight of font.weights) {
    const byStyle = meta.variants[String(weight)];
    if (!byStyle) {
      continue;
    }

    for (const style of STYLES) {
      if (!byStyle[style]?.[SUBSET]) {
        continue;
      }

      targets.push({
        weight,
        style,
        subset: SUBSET,
        path: getVariantPath(font.id, SUBSET, weight, style),
      });
    }
  }

  const variants = await Promise.all(
    targets.map((variant) => syncVariant(font.id, variant)),
  );

  variants.sort((a, b) => {
    const aw =
      typeof a.file.weight === "number" ? a.file.weight : a.file.weight.min;
    const bw =
      typeof b.file.weight === "number" ? b.file.weight : b.file.weight.min;
    return aw - bw || a.file.style.localeCompare(b.file.style);
  });

  return variants;
}

async function collectVariableVariants(
  font: FontConfig,
  meta: FontsourceFont,
  weight: { min: number; max: number },
): Promise<VariantResult[]> {
  const styles = STYLES.filter((style) => meta.styles.includes(style));

  const variants = await Promise.all(
    styles.map((style) =>
      syncVariant(font.id, {
        weight,
        style,
        subset: SUBSET,
        path: getVariantPath(font.id, SUBSET, "wght", style),
      }),
    ),
  );

  variants.sort((a, b) => a.file.style.localeCompare(b.file.style));

  return variants;
}

async function syncPreview(
  font: FontConfig,
  meta: FontsourceFont,
  variable: FontsourceVariableFont | null,
): Promise<{ path: string; uploaded: boolean }> {
  const path = getPreviewPath(font.id);

  if (await objectExists(FONTS_BUCKET, path)) {
    return { path, uploaded: false };
  }

  let sourceUrl: string;
  if (variable?.axes.wght) {
    sourceUrl = getFontUrl(font.id, SUBSET, "wght", "normal");
  } else {
    const weight = font.weights[0];
    if (
      weight === undefined ||
      !meta.variants[String(weight)]?.normal?.[SUBSET]
    ) {
      throw new Error(`No source font to subset for ${font.id}`);
    }

    sourceUrl = getFontUrl(font.id, SUBSET, weight, "normal");
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${sourceUrl}: ${response.status} ${response.statusText}`,
    );
  }
  const fontBuffer = Buffer.from(await response.arrayBuffer());

  const wght = variable?.axes.wght;
  const variationAxes = wght ? { wght: Number(wght.default) } : undefined;

  const subsetBuffer = await subsetFont(fontBuffer, font.family, {
    targetFormat: "woff2",
    variationAxes,
  });

  await upload(
    FONTS_BUCKET,
    path,
    subsetBuffer,
    WOFF2_CONTENT_TYPE,
    WOFF2_CACHE_CONTROL,
  );

  return { path, uploaded: true };
}

async function syncFont(font: FontConfig): Promise<FontSyncResult> {
  const [meta, variable] = await Promise.all([
    fetchFontMetadata(font.id),
    fetchVariableFontMetadata(font.id),
  ]);

  const wght = variable?.axes.wght;
  const [variants, preview] = await Promise.all([
    wght
      ? collectVariableVariants(font, meta, {
          min: Number(wght.min),
          max: Number(wght.max),
        })
      : collectStaticVariants(font, meta),
    syncPreview(font, meta, variable),
  ]);

  const variantUploads = variants.filter((r) => r.uploaded).length;
  const uploaded = variantUploads + (preview.uploaded ? 1 : 0);
  const skipped = variants.length + 1 - uploaded;

  return {
    id: font.id,
    font: {
      family: meta.family,
      version: meta.version,
      files: variants.map((r) => r.file),
      previewPath: preview.path,
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
      files: result.font.files.length + 1,
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

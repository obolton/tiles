import subsetFont from "subset-font";
import type { FontConfig } from "./config";
import { FontStyleSchema } from "./manifest";
import type { FontsManifest, FontStyle, FontVariant, ManifestFont } from "./manifest";
import type { FontBucket } from "./storage";
import {
  getFontUrl,
  fetchFontMetadata,
  fetchVariableFontMetadata,
  type FontsourceFont,
  type FontsourceVariableFont,
} from "./fontsource";

const SUBSET = "latin";
const STYLES = FontStyleSchema.options;
const WOFF2_METADATA = {
  contentType: "font/woff2",
  cacheControl: "public, max-age=31536000, immutable",
};

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

async function objectExists(bucket: FontBucket, path: string): Promise<boolean> {
  return (await bucket.head(path)) !== null;
}

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}

async function syncFile(bucket: FontBucket, path: string, url: string): Promise<boolean> {
  if (await objectExists(bucket, path)) {
    return false;
  }

  await bucket.put(path, await fetchBytes(url), { httpMetadata: WOFF2_METADATA });

  return true;
}

async function syncVariant(
  bucket: FontBucket,
  fontId: string,
  variant: FontVariant,
): Promise<VariantResult> {
  const slug = typeof variant.weight === "number" ? variant.weight : "wght";
  const url = getFontUrl(fontId, variant.subset, slug, variant.style);
  return {
    file: variant,
    uploaded: await syncFile(bucket, variant.path, url),
  };
}

async function collectStaticVariants(
  bucket: FontBucket,
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
    targets.map((variant) => syncVariant(bucket, font.id, variant)),
  );

  variants.sort((a, b) => {
    const aw = typeof a.file.weight === "number" ? a.file.weight : a.file.weight.min;
    const bw = typeof b.file.weight === "number" ? b.file.weight : b.file.weight.min;
    return aw - bw || a.file.style.localeCompare(b.file.style);
  });

  return variants;
}

async function collectVariableVariants(
  bucket: FontBucket,
  font: FontConfig,
  meta: FontsourceFont,
  weight: { min: number; max: number },
): Promise<VariantResult[]> {
  const styles = STYLES.filter((style) => meta.styles.includes(style));

  const variants = await Promise.all(
    styles.map((style) =>
      syncVariant(bucket, font.id, {
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
  bucket: FontBucket,
  font: FontConfig,
  meta: FontsourceFont,
  variable: FontsourceVariableFont | null,
): Promise<{ path: string; uploaded: boolean }> {
  const path = getPreviewPath(font.id);

  if (await objectExists(bucket, path)) {
    return { path, uploaded: false };
  }

  let sourceUrl: string;
  if (variable?.axes.wght) {
    sourceUrl = getFontUrl(font.id, SUBSET, "wght", "normal");
  } else {
    const weight = font.weights[0];
    if (weight === undefined || !meta.variants[String(weight)]?.normal?.[SUBSET]) {
      throw new Error(`No source font to subset for ${font.id}`);
    }

    sourceUrl = getFontUrl(font.id, SUBSET, weight, "normal");
  }

  const fontBuffer = Buffer.from(await fetchBytes(sourceUrl));

  const wght = variable?.axes.wght;
  const variationAxes = wght ? { wght: Number(wght.default) } : undefined;

  const subsetBuffer = await subsetFont(fontBuffer, font.family, {
    targetFormat: "woff2",
    variationAxes,
  });

  await bucket.put(path, subsetBuffer, { httpMetadata: WOFF2_METADATA });

  return { path, uploaded: true };
}

async function syncFont(bucket: FontBucket, font: FontConfig): Promise<FontSyncResult> {
  const [meta, variable] = await Promise.all([
    fetchFontMetadata(font.id),
    fetchVariableFontMetadata(font.id),
  ]);

  const wght = variable?.axes.wght;
  const [variants, preview] = await Promise.all([
    wght
      ? collectVariableVariants(bucket, font, meta, {
          min: Number(wght.min),
          max: Number(wght.max),
        })
      : collectStaticVariants(bucket, font, meta),
    syncPreview(bucket, font, meta, variable),
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
  bucket: FontBucket,
  fonts: readonly FontConfig[],
  onProgress?: (progress: FontProgress) => void,
): Promise<FontsSyncSummary> {
  const results: FontSyncResult[] = [];

  for (const font of fonts) {
    const result = await syncFont(bucket, font);
    onProgress?.({
      id: result.id,
      files: result.font.files.length + 1,
      uploaded: result.uploaded,
      skipped: result.skipped,
    });
    results.push(result);
  }

  const manifest: FontsManifest = {
    fonts: Object.fromEntries(results.map((r) => [r.id, r.font])),
  };

  return {
    manifest,
    uploaded: results.reduce((sum, r) => sum + r.uploaded, 0),
    skipped: results.reduce((sum, r) => sum + r.skipped, 0),
  };
}

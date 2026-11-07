import { toPlainText } from "@/utils/richText/plainText";
import type { CellValue } from "@/models/Row";

/**
 * Default series colours: a categorical palette validated for colour-vision deficiency and
 * contrast, with steps selected for light and dark surfaces. Assigned in order, never reordered.
 */
export const SERIES_COLORS = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
} as const;

/** The most series a chart is given by default, one per palette colour. */
export const MAX_DEFAULT_SERIES = SERIES_COLORS.light.length;

/** The plain text of a cell, or `null` when it is empty. */
export function toCellText(cell: CellValue | undefined): string | null {
  if (!cell) {
    return null;
  }
  const text = (Array.isArray(cell) ? toPlainText(cell) : cell).trim();
  return text || null;
}

function parseNumber(text: string): number | null {
  const value = Number(text.replace(/[,\s]/g, ""));
  return Number.isFinite(value) ? value : null;
}

/** The numeric value of a cell, or `null` when it is empty or not a number. */
export function toNumber(cell: CellValue | undefined): number | null {
  const text = toCellText(cell);
  return text === null ? null : parseNumber(text);
}

/** Whether a column holds numbers: at least one value, and nothing that is not a number. */
export function isNumericColumn(cells: readonly CellValue[]): boolean {
  const texts = cells.map(toCellText).filter((text) => text !== null);
  return texts.length > 0 && texts.every((text) => parseNumber(text) !== null);
}

import Section from "@/models/Section";
import type { SetSectionLayoutAction, SetSectionColumnsAction } from "../types";
import type { ActionExecutor } from "./types";

const setLayout: ActionExecutor<SetSectionLayoutAction> = async (
  editor,
  { tileId, layout },
) => {
  const section = editor.page.getTile(tileId, Section);
  section.layout.value = layout;
};

const setColumns: ActionExecutor<SetSectionColumnsAction> = async (
  editor,
  { tileId, columns },
) => {
  const section = editor.page.getTile(tileId, Section);
  section.columns.value = columns;
};

export const executors = {
  "section.setLayout": setLayout,
  "section.setColumns": setColumns,
} as const;

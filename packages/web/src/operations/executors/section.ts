import Section from "@/models/Section";
import type { SetSectionLayoutAction } from "../types";
import type { ActionExecutor } from "./types";

const setLayout: ActionExecutor<SetSectionLayoutAction> = async (
  editor,
  { tileId, layout },
) => {
  const section = editor.page.getTile(tileId, Section);
  section.layout.value = layout;
};

export const executors = {
  "section.setLayout": setLayout,
} as const;

import Section from "@/models/Section";
import type { SetSectionLayoutAction } from "../types";
import type { ActionExecutor } from "./types";

const setLayout: ActionExecutor<SetSectionLayoutAction> = async (
  editor,
  { sectionId, layout },
) => {
  const section = editor.getTileAs(sectionId, Section);
  await section.setLayout(layout);
};

export const executors = {
  "section.setLayout": setLayout,
} as const;

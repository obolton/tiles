import Section from "@/models/Section";
import type {
  SetSectionLayoutAction,
  SetSectionMapStyleAction,
} from "../types";
import type { ActionExecutor } from "./types";

const setLayout: ActionExecutor<SetSectionLayoutAction> = async (
  editor,
  { sectionId, layout },
) => {
  const section = editor.page.getTile(sectionId, Section);
  section.layout.value = layout;
};

const setMapStyle: ActionExecutor<SetSectionMapStyleAction> = async (
  editor,
  { sectionId, mapStyle },
) => {
  const section = editor.page.getTile(sectionId, Section);
  section.mapStyle.value = mapStyle;
};

export const executors = {
  "section.setLayout": setLayout,
  "section.setMapStyle": setMapStyle,
} as const;

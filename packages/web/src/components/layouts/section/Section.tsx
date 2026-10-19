import { combine } from "reactivity";
import ScrollSection from "./ScrollSection";
import CalendarSection from "./CalendarSection";
import MapSection from "./MapSection";
import SectionToolbar from "./SectionToolbar";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import type SectionModel from "@/models/Section";
import type { Reactive } from "reactivity";

export interface SectionProps {
  section: SectionModel;
  showToolbar: Reactive<boolean>;
  signal?: AbortSignal;
}

export default function Section({ section, showToolbar, signal }: SectionProps) {
  const { layout, editor } = section;
  const { isEditable } = editor;

  const resize = combine({ isEditable, layout }, ({ isEditable, layout }) => {
    if (!isEditable) {
      return null;
    }

    switch (layout) {
      case "FREEFORM":
      case "MAP":
        return "all";
      case "GRID":
        return "e se s";
      case "CALENDAR":
        return null;
      case "HORIZONTAL":
        return "e";
      case "VERTICAL":
        return "s";
    }
  });

  const tabindex = isEditable.derive((editable) => (editable ? 0 : undefined));

  const content = layout.derive((value) => {
    switch (value) {
      case "CALENDAR":
        return <CalendarSection section={section} tabindex={tabindex} resize={resize} />;

      case "MAP":
        return <MapSection section={section} tabindex={tabindex} resize={resize} signal={signal} />;

      default:
        return (
          <ScrollSection
            section={section}
            layout={value}
            tabindex={tabindex}
            resize={resize}
            signal={signal}
          />
        );
    }
  });

  return (
    <>
      <If condition={showToolbar}>
        <Portal element="toolbar-slot">
          <SectionToolbar section={section} />
        </Portal>
      </If>
      {content}
    </>
  );
}

import Each from "@/jsx/each";
import Section from "@/components/layouts/section/Section";
import type { SectionWithTiles } from "@/types/tiles";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";

export interface PageContentsProps {
  editor: Editor;
  sections: Reactive<SectionWithTiles[]>;
}

export default function PageContents({ editor, sections }: PageContentsProps) {
  return (
    <Each items={sections}>
      {(section) => <Section editor={editor} section={section} />}
    </Each>
  );
}

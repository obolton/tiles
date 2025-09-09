import Each from "@/jsx/each";
import Section from "@/components/layouts/section/Section";
import type { Layout } from "@/types/tiles";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";

export interface PageContentsProps {
  editor: Editor;
  layout: Reactive<Layout>;
}

export default function PageContents({ editor, layout }: PageContentsProps) {
  return (
    <Each items={layout}>
      {(section) => <Section editor={editor} section={section} />}
    </Each>
  );
}

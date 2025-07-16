import Section from "@/components/layouts/section/Section";
import Placeholder from "@/components/placeholder/Placeholder";
import type { Layout } from "@/types/tiles";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";

interface PageContentsProps {
  editor: Editor;
  isEditable: Reactive<boolean>;
  layout: Reactive<Layout>;
}

export default function PageContents({
  editor,
  isEditable,
  layout,
}: PageContentsProps) {
  return layout.derive((sections) =>
    sections.length === 0 ? (
      <Placeholder>
        {isEditable.derive((editable) =>
          editable
            ? "There’s nothing here yet. Get starting by adding a section."
            : "This page is empty.",
        )}
      </Placeholder>
    ) : (
      sections.map((section) => <Section editor={editor} section={section} />)
    ),
  );
}

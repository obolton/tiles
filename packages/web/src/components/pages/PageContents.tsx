import Section from "@/components/layouts/section/Section";
import Placeholder from "@/components/placeholder/Placeholder";
import type { Layout } from "@/types/layout";
import type { StoreInterface } from "@/utils/stores";
import type Editor from "@/editor/Editor";

interface PageContentsProps {
  editor: Editor;
  isEditable: StoreInterface<boolean>;
  layout: StoreInterface<Layout>;
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
      sections.map((section) => (
        <Section editor={editor} isEditable={isEditable} section={section} />
      ))
    ),
  );
}

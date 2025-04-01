import Section from "@/components/layouts/section/Section";
import Placeholder from "@/components/placeholder/Placeholder";
import useEditable from "@/hooks/useEditable";
import type { Layout } from "@/types/layout";

interface PageContentsProps {
  layout: Layout;
}

export default function PageContents({ layout }: PageContentsProps) {
  const isEditable = useEditable();

  return (
    <>
      {layout.length === 0 ? (
        <Placeholder>
          {isEditable
            ? "There’s nothing here yet. Get starting by adding a section."
            : "This page is empty."}
        </Placeholder>
      ) : (
        layout.map((section) => <Section key={section.id} section={section} />)
      )}
    </>
  );
}

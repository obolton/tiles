import Canvas from "@/components/layouts/canvas/Canvas";
import Placeholder from "@/components/placeholder/Placeholder";
import type { SectionWithTiles } from "@/types/tiles";
import type Editor from "@/editor/Editor";

export interface SectionLayoutProps {
  editor: Editor;
  section: SectionWithTiles;
}

function SectionPlaceholder() {
  return <Placeholder />;
}

export default function SectionLayout({ editor, section }: SectionLayoutProps) {
  const { isEditable } = editor;

  return (
    <Canvas
      editor={editor}
      isEditable={isEditable}
      sectionId={section.id}
      items={section.tiles}
      minColumnSpan={2}
      minRowSpan={1}
      Placeholder={SectionPlaceholder}
    />
  );
}

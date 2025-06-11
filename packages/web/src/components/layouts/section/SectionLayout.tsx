import Grid from "@/components/layouts/grid/Grid";
import Carousel from "@/components/layouts/carousel/Carousel";
import Placeholder from "@/components/placeholder/Placeholder";
import type { Section } from "@/types/tiles";
import type Editor from "@/editor/Editor";

export interface SectionLayoutProps {
  editor: Editor;
  section: Section;
}

function SectionPlaceholder() {
  return <Placeholder />;
}

export default function SectionLayout({ editor, section }: SectionLayoutProps) {
  const { isEditable } = editor;
  const { layout } = section;

  return layout.derive((value) => {
    switch (value) {
      default:
      case "GRID":
        return (
          <Grid
            editor={editor}
            isEditable={isEditable}
            collectionId={section.id}
            items={section.tiles}
            columns={6}
            minColumnSpan={2}
            minRowSpan={1}
            Placeholder={SectionPlaceholder}
          />
        );

      case "COLUMN":
        return (
          <Grid
            editor={editor}
            isEditable={isEditable}
            collectionId={section.id}
            items={section.tiles}
            columns={1}
            minColumnSpan={1}
            minRowSpan={1}
            Placeholder={SectionPlaceholder}
          />
        );

      case "CAROUSEL":
        return (
          <Carousel
            editor={editor}
            collectionId={section.id}
            items={section.tiles}
            Placeholder={SectionPlaceholder}
          />
        );
    }
  });
}

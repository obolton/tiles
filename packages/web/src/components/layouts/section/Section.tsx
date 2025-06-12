import SectionLayout from "./SectionLayout";
import TileButtons from "@/components/menu/TileButtons";
import GridIcon from "@/icons/grid.svg?jsx";
import ColumnIcon from "@/icons/column.svg?jsx";
import CarouselIcon from "@/icons/carousel.svg?jsx";
import FullWidthIcon from "@/icons/full-width.svg?jsx";
import MoreIcon from "@/icons/more.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import { layoutTransition } from "@/utils/animation/layout";
import { flag } from "@/utils/reactivity";
import { viewTransition } from "@/utils/transitions";
import { handleError } from "@/utils/errors";
import styles from "./Section.module.css";
import type { SectionWithTiles, ClientCollection } from "@/types/tiles";
import type Editor from "@/editor/Editor";

export interface SectionProps {
  editor: Editor;
  section: SectionWithTiles;
}

export default function Section({ editor, section }: SectionProps) {
  const { layout, width } = section;
  const fullWidth = width.derive((value) => value === "VIEWPORT");
  const hasFocus = flag(false);
  const { isEditable } = editor;

  const setLayout = async (value: ClientCollection["layout"]) => {
    if (value === layout.value) {
      return;
    }
    try {
      await editor.updateCollection({
        id: section.id,
        layout: value,
      });
      viewTransition(() => {
        layout.value = value;
      });
    } catch (error) {
      handleError(error);
    }
  };

  const toggleFullWidth = async () => {
    try {
      await editor.updateCollection({
        id: section.id,
        width: fullWidth.value ? "DEFAULT" : "VIEWPORT",
      });
      viewTransition(
        () =>
          (width.value = width.value === "VIEWPORT" ? "DEFAULT" : "VIEWPORT"),
      );
    } catch (error) {
      handleError(error);
    }
  };

  const deleteSection = async () => {
    try {
      await editor.deleteSection({ id: section.id }, layoutTransition);
    } catch (error) {
      handleError(error);
    }
  };

  const onFocus = () => {
    hasFocus.on();
    editor.focusedTile.value = section.id;
  };

  const onBlur = () => {
    hasFocus.off();
    editor.focusedTile.value = null;
  };

  return (
    <section
      classList={{
        [styles.section]: true,
        [styles["full-width"]]: fullWidth,
      }}
      tabIndex={isEditable.derive((value) => (value ? 0 : undefined))}
      data-animate-layout-id={section.id}
      on:focus={onFocus}
      on:blur={onBlur}
    >
      <SectionLayout editor={editor} section={section} />

      {hasFocus.derive((value) =>
        value ? (
          <floating-toolbar
            data-tooltip-position="top"
            aria-label="Section toolbar"
          >
            <TileButtons editor={editor} collectionId={section.id} />

            <ul role="group" aria-label="Layout">
              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  className="floating small"
                  aria-label="Grid"
                  data-tooltip="Grid"
                  aria-pressed={layout.derive((value) =>
                    value === "GRID" ? "true" : "false",
                  )}
                  on:click={() => setLayout("GRID")}
                >
                  <GridIcon aria-hidden="true" />
                </button>
              </li>

              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  className="floating small"
                  aria-label="Column"
                  data-tooltip="Column"
                  aria-pressed={layout.derive((value) =>
                    value === "COLUMN" ? "true" : "false",
                  )}
                  on:click={() => setLayout("COLUMN")}
                >
                  <ColumnIcon aria-hidden="true" />
                </button>
              </li>

              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  className="floating small"
                  aria-label="Carousel"
                  data-tooltip="Carousel"
                  aria-pressed={layout.derive((value) =>
                    value === "CAROUSEL" ? "true" : "false",
                  )}
                  on:click={() => setLayout("CAROUSEL")}
                >
                  <CarouselIcon aria-hidden="true" />
                </button>
              </li>
            </ul>

            <ul role="group" aria-label="Size">
              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  className="floating small"
                  aria-label="Full width"
                  data-tooltip="Full width"
                  aria-pressed={fullWidth.derive((value) =>
                    value ? "true" : "false",
                  )}
                  on:click={toggleFullWidth}
                >
                  <FullWidthIcon aria-hidden="true" />
                </button>
              </li>
            </ul>

            <ul role="group" aria-label="More options">
              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  id={`${section.id}-options-button`}
                  className="floating small"
                  popoverTarget={`${section.id}-options`}
                  aria-label="More options"
                  data-tooltip="More options"
                  aria-haspopup="menu"
                  aria-expanded="false"
                >
                  <MoreIcon aria-hidden="true" />
                </button>
                <popover-menu
                  id={`${section.id}-options`}
                  anchor={`${section.id}-options-button`}
                >
                  <menu>
                    <li>
                      <button
                        type="button"
                        className="destructive"
                        on:click={deleteSection}
                      >
                        <TrashIcon aria-hidden="true" />
                        Delete section
                      </button>
                    </li>
                  </menu>
                </popover-menu>
              </li>
            </ul>
          </floating-toolbar>
        ) : null,
      )}
    </section>
  );
}

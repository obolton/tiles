import ToolbarButton from "@/components/buttons/ToolbarButton";
import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import GridLayoutIcon from "@/icons/grid-layout.svg?jsx";
import HorizontalLayoutIcon from "@/icons/horizontal-layout.svg?jsx";
import VerticalLayoutIcon from "@/icons/vertical-layout.svg?jsx";
import FreeformLayoutIcon from "@/icons/freeform-layout.svg?jsx";
import AnchorTopIcon from "@/icons/anchor-top.svg?jsx";
import AnchorBottomIcon from "@/icons/anchor-bottom.svg?jsx";
import AnchorLeftIcon from "@/icons/anchor-left.svg?jsx";
import AnchorRightIcon from "@/icons/anchor-right.svg?jsx";
import ArrowUpIcon from "@/icons/arrow-up.svg?jsx";
import ArrowDownIcon from "@/icons/arrow-down.svg?jsx";
import HiddenIcon from "@/icons/hidden.svg?jsx";
import MoreIcon from "@/icons/more.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import { classNames } from "@/utils/css";
import styles from "./SectionToolbar.module.css";
import Editor from "@/editor/Editor";
import type { SectionWithTiles } from "@/types/tiles";
import type { Background } from "@/components/backgrounds/types";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { Layout, Anchor } from "@/types/pages";

export interface SectionToolbarProps {
  section: SectionWithTiles;
}

export default function SectionToolbar({ section }: SectionToolbarProps) {
  async function setLayout(event: Event) {
    const layout = (event.currentTarget as SwatchSelect).value as Layout;
    try {
      await Editor.current.updateSection({
        id: section.id,
        layout,
      });
      viewTransition(() => (section.layout.value = layout));
    } catch (error) {
      handleError(error);
    }
  }

  async function setAnchor(event: Event) {
    const anchor = (event.currentTarget as SwatchSelect).value as Anchor;
    try {
      await Editor.current.updateSection({
        id: section.id,
        anchor,
      });
      viewTransition(() => (section.anchor.value = anchor));
    } catch (error) {
      handleError(error);
    }
  }

  async function setBackground(value: Background | null) {
    try {
      const { background: newBackground } = await Editor.current.updateSection({
        id: section.id,
        background: value,
      });
      viewTransition(() => (section.background.value = newBackground));
    } catch (error) {
      handleError(error);
    }
  }

  function toggleVisibility() {
    const value = !section.hide.value;
    viewTransition(() => {
      section.hide.value = value;
    });
    Editor.current
      .updateSection({
        id: section.id,
        hide: value,
      })
      .catch(handleError);
  }

  async function moveUp() {
    try {
      await Editor.current.moveSectionUp(section.id);
    } catch (error) {
      handleError(error);
    }
  }

  async function moveDown() {
    try {
      await Editor.current.moveSectionDown(section.id);
    } catch (error) {
      handleError(error);
    }
  }

  function deleteSection() {
    Editor.current.deleteSection({ id: section.id }).catch(handleError);
  }

  return (
    <div className={styles.container}>
      <floating-toolbar
        className={classNames("vertical", styles.toolbar)}
        data-tooltip-position="right"
        aria-label="Section toolbar"
      >
        <ul role="group" aria-label="Section tools">
          <li role="presentation">
            <swatch-select
              role="menuitem"
              aria-label="Layout"
              data-tooltip="Layout"
              orientation="horizontal"
              align="center"
              value={section.layout}
              on:change={setLayout}
            >
              {section.layout.derive((value) => {
                switch (value) {
                  case "GRID":
                    return <GridLayoutIcon aria-hidden="true" slot="icon" />;
                  case "HORIZONTAL":
                    return (
                      <HorizontalLayoutIcon aria-hidden="true" slot="icon" />
                    );
                  case "VERTICAL":
                    return (
                      <VerticalLayoutIcon aria-hidden="true" slot="icon" />
                    );
                  case "FREEFORM":
                    return (
                      <FreeformLayoutIcon aria-hidden="true" slot="icon" />
                    );
                }
              })}
              <swatch-item value="GRID" data-tooltip="Grid">
                <GridLayoutIcon aria-hidden="true" />
              </swatch-item>
              <swatch-item value="HORIZONTAL" data-tooltip="Horizontal">
                <HorizontalLayoutIcon aria-hidden="true" />
              </swatch-item>
              <swatch-item value="VERTICAL" data-tooltip="Vertical">
                <VerticalLayoutIcon aria-hidden="true" />
              </swatch-item>
              <swatch-item value="FREEFORM" data-tooltip="Freeform">
                <FreeformLayoutIcon aria-hidden="true" />
              </swatch-item>
            </swatch-select>
          </li>

          <li role="presentation">
            <swatch-select
              role="menuitem"
              aria-label="Anchor"
              aria-selected={section.anchor.derive((value) =>
                value ? "true" : undefined,
              )}
              data-tooltip="Anchor"
              orientation="horizontal"
              align="center"
              value={section.anchor}
              on:change={setAnchor}
            >
              {section.anchor.derive((value) => {
                switch (value) {
                  case "TOP":
                    return <AnchorTopIcon aria-hidden="true" slot="icon" />;
                  case "BOTTOM":
                    return <AnchorBottomIcon aria-hidden="true" slot="icon" />;
                  case "LEFT":
                  default:
                    return <AnchorLeftIcon aria-hidden="true" slot="icon" />;
                  case "RIGHT":
                    return <AnchorRightIcon aria-hidden="true" slot="icon" />;
                }
              })}
              <swatch-item value="TOP" data-tooltip="Top">
                <AnchorTopIcon aria-hidden="true" />
              </swatch-item>
              <swatch-item value="BOTTOM" data-tooltip="Bottom">
                <AnchorBottomIcon aria-hidden="true" />
              </swatch-item>
              <swatch-item value="LEFT" data-tooltip="Left">
                <AnchorLeftIcon aria-hidden="true" />
              </swatch-item>
              <swatch-item value="RIGHT" data-tooltip="Right">
                <AnchorRightIcon aria-hidden="true" />
              </swatch-item>
            </swatch-select>
          </li>

          <li role="presentation">
            <BackgroundPicker
              id={`${section.id}-background`}
              value={section.background}
              onChange={setBackground}
            />
          </li>

          <li role="presentation">
            <ToolbarButton
              label="Hide"
              aria-pressed={section.hide.derive((value) =>
                value ? "true" : "false",
              )}
              on:click={toggleVisibility}
            >
              <HiddenIcon aria-hidden="true" />
            </ToolbarButton>
          </li>
        </ul>

        <ul role="group" aria-label="Section order tools">
          <li role="presentation">
            <ToolbarButton label="Move up" on:click={moveUp}>
              <ArrowUpIcon aria-hidden="true" />
            </ToolbarButton>
          </li>

          <li role="presentation">
            <ToolbarButton label="Move down" on:click={moveDown}>
              <ArrowDownIcon aria-hidden="true" />
            </ToolbarButton>
          </li>
        </ul>

        <ul role="group" aria-label="More tools">
          <li role="presentation">
            <ToolbarButton
              id={`${section.id}-options-button`}
              label="More options"
              popoverTarget={`${section.id}-options`}
              aria-haspopup="menu"
              aria-expanded="false"
            >
              <MoreIcon aria-hidden="true" />
            </ToolbarButton>

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
    </div>
  );
}

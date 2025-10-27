import TileTools from "@/components/toolbars/tiles/TileTools";
import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import GridLayoutIcon from "@/icons/grid-layout.svg?jsx";
import HorizontalLayoutIcon from "@/icons/horizontal-layout.svg?jsx";
import VerticalLayoutIcon from "@/icons/vertical-layout.svg?jsx";
import FreeformLayoutIcon from "@/icons/freeform-layout.svg?jsx";
import AnchorTopIcon from "@/icons/anchor-top.svg?jsx";
import AnchorBottomIcon from "@/icons/anchor-bottom.svg?jsx";
import AnchorLeftIcon from "@/icons/anchor-left.svg?jsx";
import AnchorRightIcon from "@/icons/anchor-right.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import Editor from "@/editor/Editor";
import type { BackgroundUpdate } from "@/components/backgrounds/types";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { Layout, Anchor, Dimensions } from "@/types/pages";
import type Section from "@/models/Section";

export interface SectionToolbarProps {
  section: Section;
}

export default function SectionToolbar({ section }: SectionToolbarProps) {
  async function setLayout(event: Event) {
    const layout = (event.currentTarget as SwatchSelect).value as Layout;
    try {
      viewTransition(() => section.setLayout(layout));
    } catch (error) {
      handleError(error);
    }
  }

  async function setAnchor(event: Event) {
    const anchor = (event.currentTarget as SwatchSelect).value as Anchor;
    try {
      viewTransition(() => section.setAnchor(anchor));
    } catch (error) {
      handleError(error);
    }
  }

  function setDimensions(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const dimensions = select.value as Dimensions;
    Editor.current.transitionSections(() => {
      section.setDimensions(dimensions);
    });
  }

  async function setBackground(value: BackgroundUpdate) {
    try {
      await section.setBackground(value);
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="top"
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
                  return <VerticalLayoutIcon aria-hidden="true" slot="icon" />;
                case "FREEFORM":
                  return <FreeformLayoutIcon aria-hidden="true" slot="icon" />;
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
            aria-selected={section.anchor}
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
          <select
            aria-label="Size"
            value={section.dimensions}
            on:change={setDimensions}
          >
            <option value="" disabled>
              Size
            </option>
            <option
              value="LANDSCAPE"
              selected={
                section.dimensions.value === "LANDSCAPE" ? true : undefined
              }
            >
              Landscape
            </option>
            <option
              value="PORTRAIT"
              selected={
                section.dimensions.value === "PORTRAIT" ? true : undefined
              }
            >
              Portrait
            </option>
            <option
              value="CUSTOM"
              selected={
                section.dimensions.value === "CUSTOM" ? true : undefined
              }
            >
              Custom
            </option>
          </select>
        </li>

        <li role="presentation">
          <BackgroundPicker
            id={`${section.id}-background`}
            value={section.background}
            onChange={setBackground}
          />
        </li>
      </ul>

      <TileTools tile={section} />
    </floating-toolbar>
  );
}

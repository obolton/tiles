import ThemePicker from "@/components/themes/ThemePicker";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import SizeIcon from "@/icons/size.svg?jsx";
import AlignLeftIcon from "@/icons/align-left.svg?jsx";
import AlignCenterIcon from "@/icons/align-center.svg?jsx";
import AlignRightIcon from "@/icons/align-right.svg?jsx";
import { viewTransition } from "@/utils/transitions";
import type { HorizontalAlignment } from "doc/types/enums";
import type ListSelect from "@/elements/list-select/ListSelect";
import type Page from "@/models/Page";
import type Theme from "@/models/Theme";

export interface StyleTabProps {
  page: Page;
}

export default function StyleTab({ page }: StyleTabProps) {
  function setTheme(theme: Theme | null) {
    page.editor?.undoManager?.stopCapturing();
    viewTransition(() => page.setTheme(theme));
  }

  function setWidth(event: Event) {
    const value = (event.currentTarget as ListSelect).value;
    if (value) {
      page.width.value = parseInt(value, 10);
    }
  }

  function setAlignment(event: Event) {
    page.alignment.value = (event.currentTarget as ListSelect).value as HorizontalAlignment;
  }

  return (
    <toolbar-tab name="style" label="Style">
      <ToolbarGroup label="Style">
        <ThemePicker
          id="page-theme"
          value={page.theme}
          onChange={setTheme}
          aria-label="Theme"
          data-tooltip="Theme"
        />

        <list-select label="Page width" value={page.width} showvalue on:change={setWidth}>
          <SizeIcon slot="default-icon" aria-hidden="true" />
          <ListGroup>
            <ListOption value="32">Standard</ListOption>
            <ListOption value="24">Narrow</ListOption>
            <ListOption value="40">Wide</ListOption>
            <ListOption value="48">Full</ListOption>
          </ListGroup>
        </list-select>

        <list-select label="Alignment" value={page.alignment} showvalue on:change={setAlignment}>
          <ListGroup>
            <ListOption icon={<AlignLeftIcon aria-hidden="true" />} value="LEFT">
              Left
            </ListOption>
            <ListOption icon={<AlignCenterIcon aria-hidden="true" />} value="CENTER">
              Center
            </ListOption>
            <ListOption icon={<AlignRightIcon aria-hidden="true" />} value="RIGHT">
              Right
            </ListOption>
          </ListGroup>
        </list-select>
      </ToolbarGroup>
    </toolbar-tab>
  );
}

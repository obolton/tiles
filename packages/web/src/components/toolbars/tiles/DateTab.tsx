import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import { parseParentId } from "@/models/parentId";
import type Tile from "@/models/Tile";

export interface DateTabProps {
  tile: Tile;
}

export default function DateTab({ tile }: DateTabProps) {
  const parent = parseParentId(tile.parentId.value);
  if (parent.type !== "section") {
    return null;
  }

  const section = tile.page.getSection(parent.sectionId);
  if (section.layout.value !== "CALENDAR") {
    return null;
  }

  function handleStartChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    tile.setDates(input.value || null, tile.endDate.value);
  }

  function handleEndChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    tile.setDates(tile.startDate.value, input.value || null);
  }

  return (
    <toolbar-tab name="date" label="Date">
      <ToolbarGroup label="Date range">
        <label>
          Start
          <input
            type="date"
            value={tile.startDate}
            on:change={handleStartChange}
          />
        </label>
        <label>
          End
          <input type="date" value={tile.endDate} on:change={handleEndChange} />
        </label>
      </ToolbarGroup>
    </toolbar-tab>
  );
}

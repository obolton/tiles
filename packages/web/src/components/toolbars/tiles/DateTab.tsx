import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import { handleError } from "@/utils/errors";
import type Tile from "@/models/Tile";

export interface DateTabProps {
  tile: Tile;
}

export default function DateTab({ tile }: DateTabProps) {
  const { sectionId } = tile;
  if (!sectionId) {
    return null;
  }

  const section = tile.page.getSection(sectionId);
  if (section.layout.value !== "CALENDAR") {
    return null;
  }

  function handleStartChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    tile.setDates(input.value || null, tile.endDate.value).catch(handleError);
  }

  function handleEndChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    tile.setDates(tile.startDate.value, input.value || null).catch(handleError);
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

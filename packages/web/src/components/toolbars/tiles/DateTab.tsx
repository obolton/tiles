import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import { toISODate } from "@/utils/dates";
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

  const startValue = tile.startDate.derive((d) => (d ? toISODate(d) : ""));
  const endValue = tile.endDate.derive((d) => (d ? toISODate(d) : ""));

  function handleStartChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const start = input.value ? new Date(input.value) : null;
    tile.setDates(start, tile.endDate.value).catch(handleError);
  }

  function handleEndChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const end = input.value ? new Date(input.value) : null;
    tile.setDates(tile.startDate.value, end).catch(handleError);
  }

  return (
    <toolbar-tab name="date" label="Date">
      <ToolbarGroup label="Date range">
        <label>
          Start
          <input type="date" value={startValue} on:change={handleStartChange} />
        </label>
        <label>
          End
          <input type="date" value={endValue} on:change={handleEndChange} />
        </label>
      </ToolbarGroup>
    </toolbar-tab>
  );
}

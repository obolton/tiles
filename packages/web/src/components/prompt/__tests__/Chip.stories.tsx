import Chip from "../Chip";
import { TILE_ICONS } from "@/constants/icons";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Chip",
} satisfies Meta;
export default meta;

export const Link: Story = {
  render: () => <Chip icon={TILE_ICONS.CHART} label="chart" href="#chart" />,
};

export const Removable: Story = {
  render: () => <Chip icon={TILE_ICONS.TEXT} label="Quarterly summary" onRemove={() => {}} />,
};

export const LongLabel: Story = {
  render: () => (
    <Chip
      icon={TILE_ICONS.TEXT}
      label="A summary of the quarter's key results across every region"
      onRemove={() => {}}
    />
  ),
};

export const AllTypes: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {Object.entries(TILE_ICONS).map(([type, icon]) => (
        <Chip icon={icon} label={type.toLowerCase()} href={`#${type}`} />
      ))}
    </div>
  ),
};

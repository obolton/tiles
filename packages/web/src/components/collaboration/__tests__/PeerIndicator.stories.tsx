import PeerIndicator from "../PeerIndicator";
import { array } from "reactivity";
import { getUserColor } from "@/collaboration/userColor";
import type { Meta, Story } from "@/test/storybook";
import type { Peer } from "@/collaboration/Presence";
import type { JSX } from "@/jsx/jsx";

const NAMES = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Katherine Johnson",
  "Edsger Dijkstra",
];

function peers(count: number) {
  return array<Peer>(
    NAMES.slice(0, count).map((name, index) => ({
      clientId: index,
      id: `u${index}`,
      name,
      color: getUserColor(index),
      imageId: null,
    })),
  );
}

function tile(indicator: JSX.Node) {
  return (
    <div
      style={{
        position: "relative",
        width: "240px",
        height: "160px",
        margin: "64px",
        borderRadius: "8px",
        background: "var(--ui-background-color)",
        "--border-radius": "8px",
      }}
    >
      {indicator}
    </div>
  );
}

const meta = {
  title: "PeerIndicator",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => tile(<PeerIndicator peers={peers(1)} />),
};

export const MultiplePeers: Story = {
  render: () => tile(<PeerIndicator peers={peers(3)} />),
};

export const Overflow: Story = {
  render: () => tile(<PeerIndicator peers={peers(5)} />),
};

import ProfileImageStack from "../ProfileImageStack";
import { array } from "@/utils/reactivity";
import { getUserColor } from "@/collaboration/userColor";
import { action } from "storybook/actions";
import type { Meta, Story } from "@/test/storybook";
import type { Peer } from "@/collaboration/Presence";

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

const meta = {
  title: "ProfileImageStack",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => <ProfileImageStack peers={peers(3)} aria-label="Collaborators" />,
};

export const Single: Story = {
  render: () => <ProfileImageStack peers={peers(1)} />,
};

export const Overflow: Story = {
  render: () => <ProfileImageStack peers={peers(5)} />,
  parameters: {
    a11y: {
      config: {
        // The "+N" chip is drawn with the global --secondary-text-color token, which is below the
        // AA contrast threshold by design.
        rules: [{ id: "color-contrast", enabled: false }],
      },
    },
  },
};

export const Unbordered: Story = {
  render: () => <ProfileImageStack peers={peers(3)} bordered={false} />,
};

export const Interactive: Story = {
  render: () => (
    <ProfileImageStack peers={peers(3)} aria-label="Collaborators" onSelect={action("onSelect")} />
  ),
};

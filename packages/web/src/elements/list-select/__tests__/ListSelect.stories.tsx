import "../ListSelect";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import AlignLeftIcon from "@/icons/align-left.svg?jsx";
import AlignCenterIcon from "@/icons/align-center.svg?jsx";
import AlignRightIcon from "@/icons/align-right.svg?jsx";
import H1Icon from "@/icons/h1.svg?jsx";
import H2Icon from "@/icons/h2.svg?jsx";
import H3Icon from "@/icons/h3.svg?jsx";
import ParagraphIcon from "@/icons/paragraph.svg?jsx";
import CodeIcon from "@/icons/code.svg?jsx";
import UnorderedListIcon from "@/icons/unordered-list.svg?jsx";
import OrderedListIcon from "@/icons/ordered-list.svg?jsx";
import CheckListIcon from "@/icons/check-list.svg?jsx";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "ListSelect",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <list-select label="Fruit" orientation="vertical">
      <ListGroup>
        <ListOption value="apple">Apple</ListOption>
        <ListOption value="banana">Banana</ListOption>
        <ListOption value="cherry">Cherry</ListOption>
      </ListGroup>
    </list-select>
  ),
};

export const WithSelectedValue: Story = {
  render: () => (
    <list-select label="Fruit" orientation="vertical" value="banana">
      <ListGroup>
        <ListOption value="apple">Apple</ListOption>
        <ListOption value="banana">Banana</ListOption>
        <ListOption value="cherry">Cherry</ListOption>
      </ListGroup>
    </list-select>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <list-select label="Text format" orientation="vertical" value="h1">
      <ListGroup>
        <ListOption icon={<H1Icon aria-hidden="true" />} value="h1">
          Heading 1
        </ListOption>
        <ListOption icon={<H2Icon aria-hidden="true" />} value="h2">
          Heading 2
        </ListOption>
        <ListOption icon={<H3Icon aria-hidden="true" />} value="h3">
          Heading 3
        </ListOption>
        <ListOption icon={<ParagraphIcon aria-hidden="true" />} value="">
          Paragraph
        </ListOption>
      </ListGroup>
    </list-select>
  ),
};

export const WithMultipleGroups: Story = {
  render: () => (
    <list-select label="Text format" orientation="vertical" value="">
      <ListGroup>
        <ListOption icon={<H1Icon aria-hidden="true" />} value="h1">
          Heading 1
        </ListOption>
        <ListOption icon={<H2Icon aria-hidden="true" />} value="h2">
          Heading 2
        </ListOption>
        <ListOption icon={<H3Icon aria-hidden="true" />} value="h3">
          Heading 3
        </ListOption>
        <ListOption icon={<CodeIcon aria-hidden="true" />} value="code">
          Code
        </ListOption>
        <ListOption icon={<ParagraphIcon aria-hidden="true" />} value="">
          Paragraph
        </ListOption>
      </ListGroup>
      <ListGroup>
        <ListOption icon={<UnorderedListIcon aria-hidden="true" />} value="unordered-list">
          Bulleted list
        </ListOption>
        <ListOption icon={<OrderedListIcon aria-hidden="true" />} value="ordered-list">
          Numbered list
        </ListOption>
        <ListOption icon={<CheckListIcon aria-hidden="true" />} value="check-list">
          Check list
        </ListOption>
      </ListGroup>
    </list-select>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <list-select label="Text alignment" orientation="horizontal" align="center" value="left">
      <ListGroup>
        <ListOption icon={<AlignLeftIcon aria-hidden="true" />} value="left" label="Align left" />
        <ListOption
          icon={<AlignCenterIcon aria-hidden="true" />}
          value="center"
          label="Align center"
        />
        <ListOption
          icon={<AlignRightIcon aria-hidden="true" />}
          value="right"
          label="Align right"
        />
      </ListGroup>
    </list-select>
  ),
};

export const ShowValue: Story = {
  render: () => (
    <list-select label="Fruit" orientation="vertical" showvalue value="banana">
      <ListGroup>
        <ListOption value="apple">Apple</ListOption>
        <ListOption value="banana">Banana</ListOption>
        <ListOption value="cherry">Cherry</ListOption>
      </ListGroup>
    </list-select>
  ),
};

export const WithDisabledOption: Story = {
  render: () => (
    <list-select label="Fruit" orientation="vertical" value="apple">
      <ListGroup>
        <ListOption value="apple">Apple</ListOption>
        <ListOption value="banana">Banana</ListOption>
      </ListGroup>
      <ListGroup>
        <ListOption value="durian" aria-disabled="true">
          Durian
        </ListOption>
      </ListGroup>
    </list-select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <list-select label="Fruit" orientation="vertical" value="apple" aria-disabled="true">
      <ListGroup>
        <ListOption value="apple">Apple</ListOption>
        <ListOption value="banana">Banana</ListOption>
        <ListOption value="cherry">Cherry</ListOption>
      </ListGroup>
    </list-select>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <list-select label="Frame" orientation="vertical" value="outlined">
      <ListGroup>
        <ListOption value="">None</ListOption>
      </ListGroup>
      <ListGroup>
        <ListOption value="outlined">Outlined</ListOption>
        <ListOption value="card">Card</ListOption>
        <ListOption value="raised">Raised</ListOption>
      </ListGroup>
      <div slot="footer" style={{ display: "flex", gap: "8px" }}>
        <button className="floating small">Sharp</button>
        <button className="floating small" aria-pressed="true">
          Rounded
        </button>
        <button className="floating small">Round</button>
      </div>
    </list-select>
  ),
};

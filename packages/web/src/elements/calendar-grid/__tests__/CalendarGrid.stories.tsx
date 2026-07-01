import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "CalendarGrid",
} satisfies Meta;

export default meta;

export const Default: Story = {
  render: () => <calendar-grid style={{ width: "800px", height: "600px" }} />,
};

const chip = {
  color: "white",
  padding: "2px 6px",
  borderRadius: "4px",
  fontSize: "12px",
};

export const WithItems: Story = {
  render: () => (
    <calendar-grid year={2026} month={2} style={{ width: "800px", height: "600px" }}>
      <calendar-date start="2026-02-03">
        <div style={{ ...chip, background: "royalblue" }}>Team standup</div>
      </calendar-date>
      <calendar-date start="2026-02-10">
        <div style={{ ...chip, background: "royalblue" }}>Sprint review</div>
      </calendar-date>
      <calendar-date start="2026-02-10">
        <div style={{ ...chip, background: "coral" }}>Design sync</div>
      </calendar-date>
      <calendar-date start="2026-02-16" end="2026-02-18">
        <div style={{ ...chip, background: "seagreen" }}>Workshop</div>
      </calendar-date>
      <calendar-date start="2026-02-24" end="2026-02-27">
        <div style={{ ...chip, background: "tomato" }}>Conference</div>
      </calendar-date>
      <calendar-date start="2026-02-12" end="2026-02-17">
        <div style={{ ...chip, background: "mediumpurple" }}>Sprint</div>
      </calendar-date>
    </calendar-grid>
  ),
};

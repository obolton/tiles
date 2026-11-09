import VersionList from "./VersionList";
import Sidebar from "@/components/pages/Sidebar";
import type VersionHistory from "./VersionHistory";
import type { JSX } from "jsx/jsx";

export interface VersionHistoryPanelProps extends JSX.Attributes<"resizable-panel"> {
  state: VersionHistory;
}

export default function VersionHistoryPanel({ state, ...props }: VersionHistoryPanelProps) {
  return (
    <Sidebar state={state} label="Version history" {...props}>
      <VersionList state={state} />
    </Sidebar>
  );
}

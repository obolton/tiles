import SidebarPanel, { PAGE_ACTIONS_BUTTON_ID } from "@/components/pages/SidebarPanel";
import type { SidebarSlot } from "@/components/pages/SidebarPanel";

export const SHARE_PANEL_ID = "share-panel";

export default class Share extends SidebarPanel {
  constructor(sidebar?: SidebarSlot) {
    super(SHARE_PANEL_ID, PAGE_ACTIONS_BUTTON_ID, sidebar);
  }
}

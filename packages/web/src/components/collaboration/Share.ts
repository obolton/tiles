import SidebarPanel from "@/components/pages/SidebarPanel";

export const SHARE_PANEL_ID = "share-panel";
export const SHARE_BUTTON_ID = "share-button";

export default class Share extends SidebarPanel {
  constructor() {
    super(SHARE_PANEL_ID, SHARE_BUTTON_ID);
  }
}

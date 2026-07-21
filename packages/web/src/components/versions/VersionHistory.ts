import client from "@/api/client";
import { flag, reactive } from "@/utils/reactivity";
import { focusInside, getFocusedDescendant } from "@/utils/focus";
import { handleError } from "@/utils/errors";
import type { AppRouterOutputs } from "@/api/client";

export type VersionEntry = AppRouterOutputs["versions"]["list"]["versions"][number];

export const VERSION_HISTORY_PANEL_ID = "version-history-panel";
export const VERSION_HISTORY_BUTTON_ID = "version-history-button";

export default class VersionHistory {
  readonly isOpen = flag(false);
  readonly selectedId = reactive<string | null>(null);
  readonly versions = reactive<VersionEntry[]>([]);
  readonly nextCursor = reactive<string | null>(null);
  readonly isLoading = flag(false);

  constructor(private readonly pageId: string) {}

  open() {
    if (this.isOpen.value) {
      return;
    }
    this.isOpen.on();
    this.refresh().catch(handleError);
    requestAnimationFrame(() => {
      const panel = document.getElementById(VERSION_HISTORY_PANEL_ID);
      if (panel) {
        focusInside(panel);
      }
    });
  }

  close() {
    if (!this.isOpen.value) {
      return;
    }
    // Capture focus before the flag flips and the panel detaches
    const panel = document.getElementById(VERSION_HISTORY_PANEL_ID);
    const hadFocus = !!panel && !!getFocusedDescendant(panel);
    this.isOpen.off();
    this.select(null);
    if (hadFocus) {
      document.getElementById(VERSION_HISTORY_BUTTON_ID)?.focus();
    }
  }

  toggle() {
    if (this.isOpen.value) {
      this.close();
    } else {
      this.open();
    }
  }

  select(id: string | null) {
    this.selectedId.value = id;
    const url = new URL(window.location.href);
    if (id === null) {
      url.searchParams.delete("version");
    } else {
      url.searchParams.set("version", id);
    }
    history.replaceState(null, "", url);
  }

  async refresh() {
    this.isLoading.on();
    try {
      const results = await client.versions.list.query({ pageId: this.pageId });
      this.versions.value = results.versions;
      this.nextCursor.value = results.nextCursor;
    } catch (error) {
      handleError(error);
    } finally {
      this.isLoading.off();
    }
  }

  async loadMore() {
    const cursor = this.nextCursor.value;
    if (cursor === null || this.isLoading.value) {
      return;
    }
    this.isLoading.on();
    try {
      const results = await client.versions.list.query({ pageId: this.pageId, cursor });
      this.versions.value = [...this.versions.value, ...results.versions];
      this.nextCursor.value = results.nextCursor;
    } catch (error) {
      handleError(error);
    } finally {
      this.isLoading.off();
    }
  }
}

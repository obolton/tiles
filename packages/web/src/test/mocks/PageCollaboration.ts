import { vi } from "vitest";
import { array } from "reactivity";
import type * as Y from "yjs";
import type { PageCollaboration as ActualPageCollaboration } from "@/collaboration/PageCollaboration";
import type { Peer } from "@/collaboration/Presence";

export const publishSelection = vi.fn<ActualPageCollaboration["publishSelection"]>();
export const dispose = vi.fn<ActualPageCollaboration["dispose"]>();

const presence = {
  peersForTile: vi.fn(() => array<Peer>([])),
  getActiveTile: vi.fn(() => null),
};

export class PageCollaboration implements Pick<
  ActualPageCollaboration,
  "pageId" | "doc" | "publishSelection" | "dispose"
> {
  readonly pageId: string;
  readonly doc: Y.Doc;
  readonly publishSelection = publishSelection;
  readonly dispose = dispose;
  readonly presence = presence;

  constructor(pageId: string, doc: Y.Doc) {
    this.pageId = pageId;
    this.doc = doc;
  }
}

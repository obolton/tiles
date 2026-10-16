import { vi } from "vitest";
import type * as Y from "yjs";
import type { PageCollaboration as ActualPageCollaboration } from "@/collaboration/PageCollaboration";

export const publishSelection = vi.fn<ActualPageCollaboration["publishSelection"]>();
export const dispose = vi.fn<ActualPageCollaboration["dispose"]>();

export class PageCollaboration implements Pick<
  ActualPageCollaboration,
  "pageId" | "doc" | "publishSelection" | "dispose"
> {
  readonly pageId: string;
  readonly doc: Y.Doc;
  readonly publishSelection = publishSelection;
  readonly dispose = dispose;

  constructor(pageId: string, doc: Y.Doc) {
    this.pageId = pageId;
    this.doc = doc;
  }
}

import type * as Y from "yjs";

/** The top-level fragment holding a document page's rich text body. */
export const BODY_FRAGMENT = "body";

/** Addresses the body wherever a tile id is accepted. Tile ids are UUIDs, so it cannot collide. */
export const BODY_ID = "body";

export function getBody(doc: Y.Doc): Y.XmlFragment {
  return doc.getXmlFragment(BODY_FRAGMENT);
}

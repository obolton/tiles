import * as Y from "yjs";
import { base64ToBytes } from "doc/encoding";
import type { PageData } from "@/models/Page";

/**
 * Decodes a base64-encoded snapshot into a Y.Doc.
 */
export function initializeDoc(page: PageData): Y.Doc {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, base64ToBytes(page.document));
  return doc;
}

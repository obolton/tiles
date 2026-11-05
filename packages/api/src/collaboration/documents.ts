import type * as Y from "yjs";
import { hocuspocus } from "./instance";
import { docName } from "./server";

interface DocumentContext {
  userId: string;
  sessionId: string;
}

/**
 * Open a document for editing. Disconnects after the callback has completed.
 */
export async function withDocument<T>(
  pageId: string,
  { userId, sessionId }: DocumentContext,
  callback: (document: Y.Doc) => Promise<T>,
): Promise<T> {
  const connection = await hocuspocus.openDirectConnection(docName(pageId), {
    userId,
    sessionId,
    pageId,
  });

  try {
    const { document } = connection;
    if (!document) {
      throw new Error(`Failed to open document: ${pageId}`);
    }
    return await callback(document);
  } finally {
    await connection.disconnect();
  }
}

/**
 * Disconnect every client connected to the given page.
 */
export function closePageConnections(pageId: string) {
  hocuspocus.closeConnections(docName(pageId));
}

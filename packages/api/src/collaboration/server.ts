import * as Y from "yjs";
import { Hocuspocus } from "@hocuspocus/server";
import { authenticateConnection } from "./auth";
import { loadDoc, saveDoc } from "./storage";
import { maybeCreateVersion } from "./versions";

const DOC_NAME_PREFIX = "page:";

export function parseDocName(documentName: string): string {
  if (!documentName.startsWith(DOC_NAME_PREFIX)) {
    throw new Error(`Invalid collaboration document name: ${documentName}`);
  }
  return documentName.slice(DOC_NAME_PREFIX.length);
}

export function docName(pageId: string): string {
  return `${DOC_NAME_PREFIX}${pageId}`;
}

export function createHocuspocus() {
  return new Hocuspocus({
    name: "tiles-collaboration",
    debounce: 2000,
    maxDebounce: 10000,

    async onAuthenticate({ documentName, requestHeaders, token }) {
      const pageId = parseDocName(documentName);
      const { userId, sessionId } = await authenticateConnection({
        requestHeaders,
        token,
        pageId,
      });
      return { userId, sessionId, pageId };
    },

    async onLoadDocument({ documentName }) {
      return loadDoc(parseDocName(documentName));
    },

    async onStoreDocument({ documentName, document }) {
      const pageId = parseDocName(documentName);
      const state = Y.encodeStateAsUpdate(document);
      await saveDoc(pageId, state);
      console.log(`collaboration: stored page=${pageId} bytes=${state.byteLength}`);
    },

    async afterStoreDocument({ documentName, document }) {
      await maybeCreateVersion(parseDocName(documentName), document, "store");
    },

    async beforeUnloadDocument({ documentName, document }) {
      const pageId = parseDocName(documentName);
      try {
        await maybeCreateVersion(pageId, document, "unload");
      } catch (error) {
        console.error(`collaboration: session-end version capture failed page=${pageId}`, error);
      }
    },

    async onConnect({ documentName }) {
      console.log(`collaboration: connect page=${parseDocName(documentName)}`);
    },

    async onDisconnect({ documentName, context }) {
      console.log(
        `collaboration: disconnect page=${parseDocName(documentName)} user=${context.userId}`,
      );
    },
  });
}

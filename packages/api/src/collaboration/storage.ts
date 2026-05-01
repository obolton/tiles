import * as Y from "yjs";
import prisma from "@/database/prisma.ts";
import {
  applyMigrations,
  createEmptyDoc,
  CURRENT_SCHEMA_VERSION,
} from "./migrator.ts";

export async function loadDoc(pageId: string): Promise<Y.Doc> {
  const record = await prisma.pageDocument.findUnique({
    where: { pageId },
    select: { snapshot: true, schemaVersion: true },
  });

  if (!record) {
    return createEmptyDoc();
  }

  const doc = new Y.Doc();
  Y.applyUpdate(doc, record.snapshot);

  if (record.schemaVersion < CURRENT_SCHEMA_VERSION) {
    applyMigrations(doc, record.schemaVersion);
  }
  return doc;
}

export async function saveDoc(
  pageId: string,
  state: Uint8Array,
): Promise<void> {
  const snapshot = Buffer.from(state);
  await prisma.pageDocument.upsert({
    where: { pageId },
    create: {
      pageId,
      snapshot,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    },
    update: {
      snapshot,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    },
  });
}

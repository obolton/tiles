import * as Y from "yjs";
import prisma from "@/database/prisma";
import { applyMigrations, CURRENT_SCHEMA_VERSION } from "./migrator";
import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_DOCUMENT_FIELDS = {
  document: { select: { snapshot: true, schemaVersion: true } },
} as const satisfies Prisma.PageSelect<ExtensionArgs>;

export async function loadDoc(pageId: string): Promise<Y.Doc> {
  const page = await prisma.page.findUniqueOrThrow({
    where: { id: pageId },
    select: PAGE_DOCUMENT_FIELDS,
  });

  const doc = new Y.Doc();
  Y.applyUpdate(doc, page.document.snapshot);

  if (page.document.schemaVersion < CURRENT_SCHEMA_VERSION) {
    applyMigrations(doc, page.document.schemaVersion);
  }
  return doc;
}

export async function saveDoc(pageId: string, state: Uint8Array): Promise<void> {
  const snapshot = Buffer.from(state);
  await prisma.page.update({
    where: { id: pageId },
    data: {
      document: {
        update: { snapshot, schemaVersion: CURRENT_SCHEMA_VERSION },
      },
    },
  });
}

import * as Y from "yjs";
import { equalBytes } from "doc/encoding";
import prisma from "@/database/prisma";
import { CURRENT_SCHEMA_VERSION } from "./migrator";
import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma, PageVersionType } from "@/generated/prisma/client";

export const AUTO_CHECKPOINT_INTERVAL = 15 * 60 * 1000;

export type CaptureTrigger = "store" | "unload";

export const VERSION_FIELDS = {
  id: true,
  type: true,
  name: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
} as const satisfies Prisma.PageVersionSelect<ExtensionArgs>;

export const LATEST_VERSION_FIELDS = {
  id: true,
  stateVector: true,
  createdAt: true,
} as const satisfies Prisma.PageVersionSelect<ExtensionArgs>;

interface CreateVersionOptions {
  type: PageVersionType;
  name?: string;
  userId?: string;
}

export async function createVersion(
  pageId: string,
  document: Y.Doc,
  { type, name, userId }: CreateVersionOptions,
) {
  return prisma.pageVersion.create({
    data: {
      pageId,
      type,
      name,
      userId,
      snapshot: new Uint8Array(Y.encodeStateAsUpdate(document)),
      stateVector: new Uint8Array(Y.encodeStateVector(document)),
      schemaVersion: CURRENT_SCHEMA_VERSION,
    },
    select: VERSION_FIELDS,
  });
}

export async function maybeCreateVersion(
  pageId: string,
  document: Y.Doc,
  trigger: CaptureTrigger,
): Promise<void> {
  const latest = await prisma.pageVersion.findFirst({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    select: LATEST_VERSION_FIELDS,
  });

  const intervalElapsed =
    !latest || Date.now() - latest.createdAt.getTime() >= AUTO_CHECKPOINT_INTERVAL;

  if (trigger === "store" && !intervalElapsed) {
    return;
  }

  if (latest && equalBytes(latest.stateVector, Y.encodeStateVector(document))) {
    return;
  }

  await createVersion(pageId, document, { type: "AUTO" });
}

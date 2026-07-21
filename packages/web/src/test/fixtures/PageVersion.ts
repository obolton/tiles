import type { VersionEntry } from "@/components/versions/VersionHistory";

export const USER = {
  id: "user-id",
  name: "Test User",
  imageUrl: null,
};

export const NAMED_VERSION: VersionEntry = {
  id: "version-named",
  type: "NAMED",
  name: "Launch draft",
  createdAt: "2026-07-20T15:42:00.000Z",
  user: USER,
};

export const AUTO_VERSION: VersionEntry = {
  id: "version-auto",
  type: "AUTO",
  name: null,
  createdAt: "2026-07-20T14:10:00.000Z",
  user: null,
};

export const PRE_RESTORE_VERSION: VersionEntry = {
  id: "version-pre-restore",
  type: "PRE_RESTORE",
  name: null,
  createdAt: "2026-07-19T09:30:00.000Z",
  user: USER,
};

export const OLDER_AUTO_VERSION: VersionEntry = {
  id: "version-auto-older",
  type: "AUTO",
  name: null,
  createdAt: "2026-07-12T18:05:00.000Z",
  user: null,
};

export const VERSIONS: VersionEntry[] = [
  NAMED_VERSION,
  AUTO_VERSION,
  PRE_RESTORE_VERSION,
  OLDER_AUTO_VERSION,
];

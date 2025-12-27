import type { Page } from "@/editor/Editor";

export const PAGE: Page = {
  id: "page-id",
  workspaceId: "workspace-id",
  updatedAt: "2025-01-01",
  folderId: "folder-id",
  theme: null,
  published: true,
  author: {
    id: "user-id",
    name: "Test User",
    username: "test",
    imageUrl: "https://tiles.dev",
  },
  title: "Test Page",
  coverImageUrl: null,
  font: "CLASSIC",
  backgroundColor: "ffff00000000",
  tiles: [],
  access: [],
  invites: [],
  dropdowns: [],
};

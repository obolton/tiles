import type { PageData } from "@/editor/Editor";

export const PAGE: PageData = {
  id: "page-id",
  workspaceId: "workspace-id",
  updatedAt: "2025-01-01",
  folderId: "folder-id",
  published: true,
  author: {
    id: "user-id",
    name: "Test User",
    username: "test",
    imageUrl: "https://tiles.dev",
  },
  title: "Test Page",
  type: "FREE",
  access: [],
  invites: [],
  document: "",
};

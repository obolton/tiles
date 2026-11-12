import type { PageData } from "@/models/Page";

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
  type: "LAYOUT",
  access: [],
  invites: [],
  document: "",
};

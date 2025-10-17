import type { Page } from "@/editor/Editor";

export const PAGE: Page = {
  id: "page-id",
  workspaceId: "workspace-id",
  updatedAt: "2025-01-01",
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
  color: {
    l: 1,
    c: 0,
    h: 0,
  },
  sections: [],
  tiles: [],
  access: [],
  invites: [],
  dropdowns: [],
};

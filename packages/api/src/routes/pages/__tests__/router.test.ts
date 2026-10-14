import { vi } from "vitest";
import {
  getPageById,
  listPages,
  listSharedPages,
  listDeletedPages,
  createPage,
  updatePage,
  deletePages,
  restorePages,
  movePages,
  emptyTrash,
} from "@/routes/pages/pages";
import { describeRouter } from "@/test/procedures";
import { PAGE_ID, WORKSPACE_ID } from "@/test/mocks/middleware";

vi.mock("@/routes/pages/pages");
vi.mock("@/utils/cdn", () => ({ invalidateCachedPages: vi.fn() }));

const FOLDER_ID = "33333333-3333-4333-8333-333333333333";

describeRouter("pages", {
  getById: {
    guard: "public",
    handler: getPageById,
    input: { id: PAGE_ID },
    invalid: { id: "not-a-uuid" },
  },
  list: {
    guard: "workspace",
    handler: listPages,
    input: { workspaceId: WORKSPACE_ID },
    invalid: { workspaceId: WORKSPACE_ID, query: "" },
  },
  listShared: {
    guard: "workspace",
    handler: listSharedPages,
    input: { workspaceId: WORKSPACE_ID },
    invalid: { workspaceId: WORKSPACE_ID, cursor: "not-a-uuid" },
  },
  listDeleted: {
    guard: "workspace",
    handler: listDeletedPages,
    input: { workspaceId: WORKSPACE_ID },
    invalid: { workspaceId: WORKSPACE_ID, query: "" },
  },
  create: {
    guard: "workspace",
    handler: createPage,
    input: { workspaceId: WORKSPACE_ID, title: "Page" },
    invalid: { workspaceId: WORKSPACE_ID, title: "" },
  },
  update: {
    guard: "pageUpdate",
    handler: updatePage,
    input: { pageId: PAGE_ID, title: "Page" },
    invalid: { pageId: PAGE_ID, title: "" },
  },
  delete: {
    guard: "workspace",
    handler: deletePages,
    input: { workspaceId: WORKSPACE_ID, pageIds: [PAGE_ID] },
    invalid: { workspaceId: WORKSPACE_ID, pageIds: [] },
  },
  restore: {
    guard: "workspace",
    handler: restorePages,
    input: { workspaceId: WORKSPACE_ID, pageIds: [PAGE_ID] },
    invalid: { workspaceId: WORKSPACE_ID, pageIds: [] },
  },
  move: {
    guard: "workspace",
    handler: movePages,
    input: { workspaceId: WORKSPACE_ID, pageIds: [PAGE_ID], folderId: FOLDER_ID },
    invalid: { workspaceId: WORKSPACE_ID, pageIds: [PAGE_ID], folderId: "not-a-uuid" },
  },
  emptyTrash: {
    guard: "workspace",
    handler: emptyTrash,
    input: { workspaceId: WORKSPACE_ID },
    args: (_, ctx) => [ctx],
    invalid: { workspaceId: "not-a-uuid" },
  },
});

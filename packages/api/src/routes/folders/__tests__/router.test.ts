import { vi } from "vitest";
import {
  createFolder,
  getFolder,
  updateFolder,
  deleteFolder,
  listFolders,
  listPages,
} from "@/routes/folders/folders";
import { describeRouter } from "@/test/procedures";
import { WORKSPACE_ID } from "@/test/mocks/middleware";

vi.mock("@/routes/folders/folders");

const FOLDER_ID = "33333333-3333-4333-8333-333333333333";

describeRouter("folders", {
  create: {
    guard: "workspace",
    handler: createFolder,
    input: { workspaceId: WORKSPACE_ID, name: "Folder" },
    invalid: { workspaceId: WORKSPACE_ID, name: "" },
  },
  get: {
    guard: "workspace",
    handler: getFolder,
    input: { workspaceId: WORKSPACE_ID, id: FOLDER_ID },
    invalid: { workspaceId: WORKSPACE_ID, id: "not-a-uuid" },
  },
  update: {
    guard: "workspace",
    handler: updateFolder,
    input: { workspaceId: WORKSPACE_ID, id: FOLDER_ID, name: "Renamed" },
    invalid: { workspaceId: WORKSPACE_ID, id: FOLDER_ID, name: "" },
  },
  delete: {
    guard: "workspace",
    handler: deleteFolder,
    input: { workspaceId: WORKSPACE_ID, id: FOLDER_ID },
    invalid: { workspaceId: WORKSPACE_ID, id: "not-a-uuid" },
  },
  list: {
    guard: "workspace",
    handler: listFolders,
    input: { workspaceId: WORKSPACE_ID },
    invalid: { workspaceId: WORKSPACE_ID, query: "" },
  },
  listPages: {
    guard: "workspace",
    handler: listPages,
    input: { workspaceId: WORKSPACE_ID, id: FOLDER_ID },
    invalid: { workspaceId: WORKSPACE_ID, id: FOLDER_ID, cursor: "not-a-uuid" },
  },
});

import { vi } from "vitest";
import {
  listVersions,
  getVersion,
  createNamedVersion,
  prepareRestore,
  renameVersion,
  deleteVersion,
  copyVersionToPage,
} from "@/routes/versions/versions";
import { describeRouter } from "@/test/procedures";
import { PAGE_ID, WORKSPACE_ID } from "@/test/mocks/middleware";

vi.mock("@/routes/versions/versions");
vi.mock("@/utils/cdn", () => ({ invalidateCachedPages: vi.fn() }));

const VERSION_ID = "88888888-8888-4888-8888-888888888888";

describeRouter("versions", {
  list: {
    guard: "page",
    handler: listVersions,
    input: { pageId: PAGE_ID },
    args: (input) => [input],
    invalid: { pageId: PAGE_ID, cursor: "not-a-uuid" },
  },
  get: {
    guard: "page",
    handler: getVersion,
    input: { pageId: PAGE_ID, versionId: VERSION_ID },
    args: (input) => [input],
    invalid: { pageId: PAGE_ID, versionId: "not-a-uuid" },
  },
  create: {
    guard: "page",
    handler: createNamedVersion,
    input: { pageId: PAGE_ID, name: "Draft" },
    invalid: { pageId: PAGE_ID, name: "" },
  },
  prepareRestore: {
    guard: "page",
    handler: prepareRestore,
    input: { pageId: PAGE_ID },
    invalid: { pageId: "not-a-uuid" },
  },
  rename: {
    guard: "page",
    handler: renameVersion,
    input: { pageId: PAGE_ID, versionId: VERSION_ID, name: "Renamed" },
    args: (input) => [input],
    invalid: { pageId: PAGE_ID, versionId: VERSION_ID, name: "" },
  },
  delete: {
    guard: "page",
    handler: deleteVersion,
    input: { pageId: PAGE_ID, versionId: VERSION_ID },
    args: (input) => [input],
    invalid: { pageId: PAGE_ID, versionId: "not-a-uuid" },
  },
  copyToPage: {
    guard: "workspace",
    handler: copyVersionToPage,
    input: { workspaceId: WORKSPACE_ID, pageId: PAGE_ID, versionId: VERSION_ID },
    invalid: { workspaceId: WORKSPACE_ID, pageId: PAGE_ID, versionId: VERSION_ID, title: "" },
  },
});

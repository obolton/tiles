import { vi } from "vitest";
import {
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteToWorkspace,
  acceptWorkspaceInvite,
  deleteWorkspaceInvite,
  listWorkspaceInvites,
  leaveWorkspace,
  removeFromWorkspace,
  listWorkspaceUsers,
  updateWorkspaceRole,
} from "../workspaces";
import { describeRouter } from "@/test/router";
import { WORKSPACE_ID } from "@/test/mocks/middleware";

vi.mock("../workspaces");

const INVITE_ID = "66666666-6666-4666-8666-666666666666";
const USER_ID = "77777777-7777-4777-8777-777777777777";

describeRouter("workspaces", {
  get: {
    guard: "workspace",
    handler: getWorkspace,
    input: { workspaceId: WORKSPACE_ID },
    invalid: { workspaceId: "not-a-uuid" },
  },
  create: {
    guard: "authenticated",
    handler: createWorkspace,
    input: { name: "Workspace" },
    invalid: { name: "" },
  },
  update: {
    guard: "admin",
    handler: updateWorkspace,
    input: { workspaceId: WORKSPACE_ID, name: "Renamed" },
    invalid: { workspaceId: WORKSPACE_ID, name: "" },
  },
  delete: {
    guard: "admin",
    handler: deleteWorkspace,
    input: { workspaceId: WORKSPACE_ID },
    args: (_, ctx) => [ctx],
    invalid: { workspaceId: "not-a-uuid" },
  },
  invite: {
    guard: "admin",
    handler: inviteToWorkspace,
    input: { workspaceId: WORKSPACE_ID, email: "bob@example.com" },
    invalid: { workspaceId: WORKSPACE_ID, email: "not-an-email" },
  },
  acceptInvite: {
    guard: "authenticated",
    handler: acceptWorkspaceInvite,
    input: { key: "invite-key" },
  },
  deleteInvite: {
    guard: "admin",
    handler: deleteWorkspaceInvite,
    input: { workspaceId: WORKSPACE_ID, id: INVITE_ID },
    invalid: { workspaceId: WORKSPACE_ID, id: "not-a-uuid" },
  },
  listInvites: {
    guard: "workspace",
    handler: listWorkspaceInvites,
    input: { workspaceId: WORKSPACE_ID },
    invalid: { workspaceId: WORKSPACE_ID, query: "" },
  },
  leave: {
    guard: "workspace",
    handler: leaveWorkspace,
    input: { workspaceId: WORKSPACE_ID },
    args: (_, ctx) => [ctx],
    invalid: { workspaceId: "not-a-uuid" },
  },
  remove: {
    guard: "admin",
    handler: removeFromWorkspace,
    input: { workspaceId: WORKSPACE_ID, userId: USER_ID },
    invalid: { workspaceId: WORKSPACE_ID, userId: "not-a-uuid" },
  },
  listUsers: {
    guard: "workspace",
    handler: listWorkspaceUsers,
    input: { workspaceId: WORKSPACE_ID },
    invalid: { workspaceId: WORKSPACE_ID, query: "" },
  },
  updateRole: {
    guard: "admin",
    handler: updateWorkspaceRole,
    input: { workspaceId: WORKSPACE_ID, userId: USER_ID, role: "MEMBER" },
    invalid: { workspaceId: WORKSPACE_ID, userId: "not-a-uuid", role: "MEMBER" },
  },
});

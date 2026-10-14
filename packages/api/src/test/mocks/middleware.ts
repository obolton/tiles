import { vi } from "vitest";
import prisma from "@/database/prisma";
import type { FindUniqueQuery } from "@/test/prisma";
import type { WorkspaceRole } from "@/generated/prisma/client";

export const PAGE_ID = "11111111-1111-4111-8111-111111111111";
export const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";

/** Mocks the page lookup made by `authenticatedPageProcedure`. */
export function mockPage(page: { id: string; workspaceId: string } | null) {
  vi.mocked(
    prisma.page.findUnique<FindUniqueQuery<{ id: true; workspaceId: true }>>,
  ).mockResolvedValue(page);
}

/** Mocks the membership lookup made by `authenticatedWorkspaceProcedure`. */
export function mockMembership(role: WorkspaceRole | null) {
  vi.mocked(
    prisma.workspaceMembership.findUnique<FindUniqueQuery<{ workspaceId: true; role: true }>>,
  ).mockResolvedValue(role ? { workspaceId: WORKSPACE_ID, role } : null);
}

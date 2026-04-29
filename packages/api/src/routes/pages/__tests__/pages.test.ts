import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma.ts";
import { createPage } from "../pages.ts";
import type { CreateQuery } from "@/test/prisma.ts";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware.ts";

const MOCK_CONTEXT: AuthenticatedWorkspaceProcedureContext = {
  res: {} as AuthenticatedWorkspaceProcedureContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  serviceName: null,
  workspaceId: "workspace-1",
  role: "ADMIN",
};

describe("createPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.page.create<CreateQuery<{ id: true }>>).mockResolvedValue({
      id: "page-1",
    });
    vi.mocked(prisma.tile.create<CreateQuery<{ id: true }>>).mockResolvedValue({
      id: "tile-1",
    });
  });

  test("defaults to DOCUMENT when type is omitted", async () => {
    await createPage({ title: "Untitled" }, MOCK_CONTEXT);

    expect(prisma.page.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "DOCUMENT" }),
      }),
    );
  });

  test("persists the requested type on the page", async () => {
    await createPage({ title: "Deck", type: "PRESENTATION" }, MOCK_CONTEXT);

    expect(prisma.page.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "PRESENTATION" }),
      }),
    );
  });

  test("seeds a single TEXT tile for DOCUMENT pages", async () => {
    await createPage({ title: "Doc", type: "DOCUMENT" }, MOCK_CONTEXT);

    expect(prisma.tile.create).toHaveBeenCalledTimes(1);
    expect(prisma.tile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "TEXT",
          text: expect.objectContaining({
            create: expect.objectContaining({
              content: [{ type: "paragraph", children: [] }],
            }),
          }),
        }),
      }),
    );
  });

  test("seeds a FREEFORM section with LANDSCAPE sizing for PRESENTATION pages", async () => {
    await createPage({ title: "Deck", type: "PRESENTATION" }, MOCK_CONTEXT);

    expect(prisma.tile.create).toHaveBeenCalledTimes(1);
    expect(prisma.tile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "SECTION",
          sizing: "LANDSCAPE",
          section: expect.objectContaining({
            create: expect.objectContaining({ layout: "FREEFORM" }),
          }),
        }),
      }),
    );
  });

  test("seeds a GRID section for COLLECTION pages", async () => {
    await createPage({ title: "Gallery", type: "COLLECTION" }, MOCK_CONTEXT);

    expect(prisma.tile.create).toHaveBeenCalledTimes(1);
    expect(prisma.tile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "SECTION",
          section: expect.objectContaining({
            create: expect.objectContaining({
              layout: "GRID",
              columns: 3,
            }),
          }),
        }),
      }),
    );
  });

  test("seeds no tiles for FREE pages", async () => {
    await createPage({ title: "Free", type: "FREE" }, MOCK_CONTEXT);

    expect(prisma.tile.create).not.toHaveBeenCalled();
  });
});

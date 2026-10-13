import { describe, test, expect, vi, beforeEach } from "vitest";
import { getTiles } from "doc/test/tiles";
import prisma from "@/database/prisma";
import { createPage, createInitialDoc } from "../pages";
import type { CreateQuery } from "@/test/prisma";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware";

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
});

describe("createInitialDoc", () => {
  test("seeds a single TEXT tile for DOCUMENT pages", () => {
    const [tile, ...rest] = getTiles(createInitialDoc("DOCUMENT"));

    expect(rest).toHaveLength(0);
    expect(tile?.type).toBe("TEXT");
  });

  test("seeds a FREEFORM, LANDSCAPE section for PRESENTATION pages", () => {
    const [tile, ...rest] = getTiles(createInitialDoc("PRESENTATION"));

    expect(rest).toHaveLength(0);
    expect(tile?.type).toBe("SECTION");
    expect(tile?.sizing).toBe("LANDSCAPE");
    expect(tile?.layout).toBe("FREEFORM");
  });

  test("seeds no tiles for COLLECTION pages", () => {
    expect(getTiles(createInitialDoc("COLLECTION"))).toHaveLength(0);
  });

  test("seeds no tiles for FREE pages", () => {
    expect(getTiles(createInitialDoc("FREE"))).toHaveLength(0);
  });
});

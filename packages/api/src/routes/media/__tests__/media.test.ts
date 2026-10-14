import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma";
import { createImage, updateImage, deleteImage } from "../media";
import { IMAGE_FIELDS } from "../fields";
import type { CreateQuery, UpdateQuery } from "@/test/prisma";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware";

const MOCK_CONTEXT: AuthenticatedWorkspaceProcedureContext = {
  res: {} as AuthenticatedWorkspaceProcedureContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  serviceName: null,
  workspaceId: "workspace-1",
  role: "ADMIN",
};

describe("createImage", () => {
  beforeEach(() => {
    vi.mocked(prisma.image.create<CreateQuery<typeof IMAGE_FIELDS>>).mockResolvedValue({
      id: "image-1",
    });
  });

  test("should create the image in the current workspace for the current user", async () => {
    await createImage(
      {
        workspaceId: "workspace-1",
        source: "UPLOAD",
        purpose: "CONTENT",
        type: "PNG",
        bytes: 1024,
        pending: true,
      },
      MOCK_CONTEXT,
    );

    expect(prisma.image.create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace-1",
        userId: "user-1",
        source: "UPLOAD",
        purpose: "CONTENT",
        type: "PNG",
        bytes: 1024,
        pending: true,
      },
      select: IMAGE_FIELDS,
    });
  });

  test("should return the new image id with its owner and workspace", async () => {
    const result = await createImage(
      { workspaceId: "workspace-1", source: "GENERATED", purpose: "PROFILE", type: "JPEG" },
      MOCK_CONTEXT,
    );

    expect(result).toEqual({ id: "image-1", userId: "user-1", workspaceId: "workspace-1" });
  });
});

describe("updateImage", () => {
  beforeEach(() => {
    vi.mocked(prisma.image.update<UpdateQuery<typeof IMAGE_FIELDS>>).mockResolvedValue({
      id: "image-1",
    });
  });

  test("should update the image scoped to the current workspace", async () => {
    const result = await updateImage(
      {
        id: "image-1",
        workspaceId: "workspace-1",
        bytes: 2048,
        width: 800,
        height: 600,
        pending: false,
      },
      MOCK_CONTEXT,
    );

    expect(prisma.image.update).toHaveBeenCalledWith({
      where: { id: "image-1", workspaceId: "workspace-1" },
      data: { bytes: 2048, width: 800, height: 600, pending: false },
      select: IMAGE_FIELDS,
    });
    expect(result).toEqual({ id: "image-1" });
  });

  test("should leave omitted fields unchanged", async () => {
    await updateImage({ id: "image-1", workspaceId: "workspace-1", pending: false }, MOCK_CONTEXT);

    expect(prisma.image.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { bytes: undefined, width: undefined, height: undefined, pending: false },
      }),
    );
  });
});

describe("deleteImage", () => {
  beforeEach(() => {
    vi.mocked(prisma.image.delete).mockResolvedValue(
      {} as Awaited<ReturnType<typeof prisma.image.delete>>,
    );
  });

  test("should delete the image scoped to the current workspace", async () => {
    const result = await deleteImage({ id: "image-1", workspaceId: "workspace-1" }, MOCK_CONTEXT);

    expect(prisma.image.delete).toHaveBeenCalledWith({
      where: { id: "image-1", workspaceId: "workspace-1" },
    });
    expect(result).toBeUndefined();
  });
});

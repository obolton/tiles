import { vi } from "vitest";
import { createImage, updateImage, deleteImage } from "@/routes/media/media";
import { describeRouter } from "@/test/procedures";
import { WORKSPACE_ID } from "@/test/mocks/middleware";

vi.mock("@/routes/media/media");

const IMAGE_ID = "44444444-4444-4444-8444-444444444444";

describeRouter("media", {
  createImage: {
    guard: "workspace",
    handler: createImage,
    input: { workspaceId: WORKSPACE_ID, source: "UPLOAD", purpose: "CONTENT", type: "PNG" },
    invalid: {
      workspaceId: WORKSPACE_ID,
      source: "UPLOAD",
      purpose: "CONTENT",
      type: "PNG",
      bytes: -1,
    },
  },
  updateImage: {
    guard: "workspace",
    handler: updateImage,
    input: { id: IMAGE_ID, workspaceId: WORKSPACE_ID, width: 100, height: 100 },
    invalid: { id: IMAGE_ID, workspaceId: WORKSPACE_ID, width: -1 },
  },
  deleteImage: {
    guard: "workspace",
    handler: deleteImage,
    input: { id: IMAGE_ID, workspaceId: WORKSPACE_ID },
    invalid: { id: "not-a-uuid", workspaceId: WORKSPACE_ID },
  },
});

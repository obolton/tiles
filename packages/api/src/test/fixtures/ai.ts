import { vi } from "vitest";
import type { ToolContext } from "@/ai/tools/types";

export const MOCK_TOOL_CONTEXT: ToolContext = {
  userId: "test-user",
  workspaceId: "test-workspace",
  pageId: "test-page",
  sectionId: null,
  model: "test-model",
  resolveArtifactId: vi.fn((id: number) => `resolved-${id}`),
};

export const MOCK_TILE_PLACEMENT = {
  id: "tile-1",
  order: "a0",
  width: 24,
  height: 20,
  x: 0,
  y: 0,
  sectionId: null,
  theme: null,
  textColor: null,
  background: null,
  anchor: null,
  dimensions: "CUSTOM" as const,
  rowSpan: 1,
  animation: null,
  hide: false,
  dock: null,
};

import { z } from "zod";
import { Animation, FrameStyle } from "doc/types/enums";
import {
  ColorBackgroundSchema,
  GradientBackgroundSchema,
} from "@/schema/Background";
import { ColorSchema } from "@/schema/Color";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo";
import type { ToolContext } from "./types";

export const SizeSchema = z.enum(["small", "medium", "large"]).meta({
  description: "The size of the block: small, medium, or large",
});

export type Size = z.infer<typeof SizeSchema>;

export interface Dimensions {
  width: number;
  height: number;
}

export function getDimensions(size: Size): Dimensions {
  switch (size) {
    case "small":
      return { width: 12, height: 10 };
    case "medium":
      return { width: 24, height: 15 };
    case "large":
      return { width: 24, height: 20 };
  }
}

export function resolveParentId(
  parentId: number | null,
  { resolveArtifactId, sectionId }: ToolContext,
): string | null {
  return parentId === null ? sectionId : resolveArtifactId(parentId);
}

// Excludes images for now
const AIBackgroundSchema = z
  .union([ColorBackgroundSchema, GradientBackgroundSchema])
  .nullable();

export const AnimationSchema = z.enum(Animation).nullable().meta({
  description: "Entrance animation effect",
});

export const HideSchema = z.boolean().nullable().meta({
  description: "Hide in view mode (only visible while editing)",
});

export const FrameSchema = z.enum(FrameStyle).nullable().meta({
  description:
    "Visual frame style: OUTLINED (thin border), SUBTLE (soft glow), CARD (paper shadow), RAISED (floating shadow), FRAMED (bold border), FULL_BLEED (extends background to container edges - only for root/vertical/horizontal layouts)",
});

export const PositionXSchema = z.number().min(0).max(100).nullable().meta({
  description: "Horizontal position (0-100%) for items in freeform sections",
});

export const PositionYSchema = z.number().min(0).max(100).nullable().meta({
  description: "Vertical position (0-100%) for items in freeform sections",
});

const TextColorSchema = ColorSchema.nullable().meta({
  description: "Text color",
});

export const CoordinatesSchema = z
  .strictObject({
    lat: z.number().gte(MIN_LATITUDE).lte(MAX_LATITUDE),
    long: z.number().gte(MIN_LONGITUDE).lte(MAX_LONGITUDE),
  })
  .nullable()
  .meta({
    description:
      "Geographic coordinates for placing this tile on a map section",
  });

export const CommonTileSchema = {
  background: AIBackgroundSchema,
  textColor: TextColorSchema,
  animation: AnimationSchema,
  frame: FrameSchema,
  hide: HideSchema,
  x: PositionXSchema,
  y: PositionYSchema,
};

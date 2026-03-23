import { z } from "zod";
import { Animation, DockEdge, FrameStyle } from "@/generated/prisma/enums";
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

// Excludes images for now
export const AIBackgroundSchema = z
  .union([ColorBackgroundSchema, GradientBackgroundSchema])
  .nullable();

export const AIColumnDefinitionSchema = z.strictObject({
  title: z.string().nullable(),
  background: AIBackgroundSchema,
});

export const AnimationSchema = z.enum(Animation).nullable().meta({
  description: "Entrance animation effect",
});

export const DockSchema = z.enum(DockEdge).nullable().meta({
  description: "Dock to viewport edge (stays fixed while scrolling)",
});

export const HideSchema = z.boolean().nullable().meta({
  description: "Hide in view mode (only visible while editing)",
});

export const FrameSchema = z.enum(FrameStyle).nullable().meta({
  description:
    "Visual frame style: OUTLINED (thin border), SUBTLE (soft glow), CARD (paper shadow), RAISED (floating shadow), FRAMED (bold border), FULL_BLEED (extends background to container edges - only for root/vertical/horizontal layouts)",
});

export const PositionSchema = z
  .strictObject({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  })
  .nullable()
  .meta({
    description: "Position (x, y as 0-100%) for items in freeform sections",
  });

export const TextColorSchema = ColorSchema.nullable().meta({
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
  dock: DockSchema,
  hide: HideSchema,
  position: PositionSchema,
};

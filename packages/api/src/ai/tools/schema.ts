import { z } from "zod";

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

import { Buffer } from "node:buffer";
import { Prisma, type GradientDirection } from "@/generated/prisma/client";

export type Fill =
  | { type: "color"; color: string }
  | {
      type: "gradient";
      colorA: string;
      colorB: string;
      direction: GradientDirection;
    };

function toHex(bytes: Uint8Array, start: number, end: number): string {
  return Buffer.from(bytes.subarray(start, end)).toString("hex");
}

function computeFill(color: Uint8Array, gradient: GradientDirection | null): Fill {
  if (gradient && color.length === 12) {
    return {
      type: "gradient",
      colorA: toHex(color, 0, 6),
      colorB: toHex(color, 6, 12),
      direction: gradient,
    };
  }

  return {
    type: "color",
    color: toHex(color, 0, 6),
  };
}

export default Prisma.defineExtension({
  name: "backgrounds-extension",
  result: {
    theme: {
      background: {
        needs: { backgroundColor: true, backgroundGradient: true },
        compute: ({ backgroundColor, backgroundGradient }) =>
          computeFill(backgroundColor, backgroundGradient),
      },
    },
  },
});

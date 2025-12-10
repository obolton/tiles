import { Buffer } from "node:buffer";
import { Prisma } from "@/generated/prisma/client";

// TODO: Use `Uint8Array.prototype.toHex` when available
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toHex

function toHex(bytes: Uint8Array | null): string | null {
  return bytes ? Buffer.from(bytes).toString("hex") : null;
}

export default Prisma.defineExtension({
  name: "colors-extension",
  result: {
    page: {
      backgroundColor: {
        needs: { backgroundColor: true },
        compute: ({ backgroundColor }) => toHex(backgroundColor),
      },
    },
    textTile: {
      textColor: {
        needs: { textColor: true },
        compute: ({ textColor }) => toHex(textColor),
      },
    },
    table: {
      textColor: {
        needs: { textColor: true },
        compute: ({ textColor }) => toHex(textColor),
      },
    },
    chartSeries: {
      color: {
        needs: { color: true },
        compute: ({ color }) => toHex(color),
      },
    },
  },
});

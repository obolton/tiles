import { Buffer } from "node:buffer";
import { Prisma } from "@/generated/prisma/client";

// TODO: Use `Uint8Array.prototype.toHex` when available
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toHex

export default Prisma.defineExtension({
  name: "colors-extension",
  result: {
    page: {
      backgroundColor: {
        needs: { backgroundColor: true },
        compute({ backgroundColor }) {
          return backgroundColor
            ? Buffer.from(backgroundColor).toString("hex")
            : null;
        },
      },
    },
    textTile: {
      textColor: {
        needs: { textColor: true },
        compute({ textColor }) {
          return textColor ? Buffer.from(textColor).toString("hex") : null;
        },
      },
    },
    table: {
      textColor: {
        needs: { textColor: true },
        compute({ textColor }) {
          return textColor ? Buffer.from(textColor).toString("hex") : null;
        },
      },
    },
    chartSeries: {
      color: {
        needs: { color: true },
        compute({ color }) {
          return color ? Buffer.from(color).toString("hex") : null;
        },
      },
    },
  },
});

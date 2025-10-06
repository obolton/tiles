import { Prisma } from "@/generated/prisma/client";

export default Prisma.defineExtension({
  name: "colors-extension",
  result: {
    page: {
      color: {
        needs: { lightness: true, chroma: true, hue: true },
        compute({ lightness: l, chroma: c, hue: h }) {
          return { l, c, h };
        },
      },
    },
    textTile: {
      textColor: {
        needs: { textL: true, textC: true, textH: true },
        compute({ textL: l, textC: c, textH: h }) {
          return typeof l === "number" &&
            typeof c === "number" &&
            typeof h === "number"
            ? { l, c, h }
            : null;
        },
      },
    },
    table: {
      textColor: {
        needs: { textL: true, textC: true, textH: true },
        compute({ textL: l, textC: c, textH: h }) {
          return typeof l === "number" &&
            typeof c === "number" &&
            typeof h === "number"
            ? { l, c, h }
            : null;
        },
      },
    },
  },
});

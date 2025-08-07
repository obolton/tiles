import { Prisma } from "@prisma/client";

export default Prisma.defineExtension({
  name: "colors-extension",
  result: {
    page: {
      color: {
        needs: { lightness: true, chroma: true, hue: true },
        compute({ lightness, chroma, hue }) {
          return { l: lightness, c: chroma, h: hue };
        },
      },
    },
    textTile: {
      color: {
        needs: { lightness: true, chroma: true, hue: true },
        compute({ lightness, chroma, hue }) {
          return typeof lightness === "number" &&
            typeof chroma === "number" &&
            typeof hue === "number"
            ? { l: lightness, c: chroma, h: hue }
            : null;
        },
      },
    },
    table: {
      color: {
        needs: { lightness: true, chroma: true, hue: true },
        compute({ lightness, chroma, hue }) {
          return typeof lightness === "number" &&
            typeof chroma === "number" &&
            typeof hue === "number"
            ? { l: lightness, c: chroma, h: hue }
            : null;
        },
      },
    },
  },
});

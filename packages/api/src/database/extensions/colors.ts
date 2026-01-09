import { Prisma } from "@/generated/prisma/client";
import { toHex } from "@/utils/arrays";

export default Prisma.defineExtension({
  name: "colors-extension",
  result: {
    page: {
      backgroundColor: {
        needs: { backgroundColor: true },
        compute: ({ backgroundColor }) =>
          backgroundColor ? toHex(backgroundColor) : null,
      },
    },
    tile: {
      textColor: {
        needs: { textColor: true },
        compute: ({ textColor }) => (textColor ? toHex(textColor) : null),
      },
    },
    chartSeries: {
      color: {
        needs: { color: true },
        compute: ({ color }) => (color ? toHex(color) : null),
      },
    },
  },
});

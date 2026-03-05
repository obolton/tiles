import { Prisma } from "@/generated/prisma/client";
import { toHex } from "@/utils/arrays";

export default Prisma.defineExtension({
  name: "themes-extension",
  result: {
    theme: {
      colors: {
        needs: { textColor: true, accentColor: true },
        compute: ({ textColor, accentColor }) => ({
          text: toHex(textColor),
          accent: toHex(accentColor),
        }),
      },
      fonts: {
        needs: { headingFont: true, bodyFont: true, codeFont: true },
        compute: ({ headingFont, bodyFont, codeFont }) => ({
          heading: headingFont,
          body: bodyFont,
          code: codeFont,
        }),
      },
      border: {
        needs: { borderColor: true },
        compute: ({ borderColor }) => ({
          color: borderColor ? toHex(borderColor) : null,
        }),
      },
    },
  },
});

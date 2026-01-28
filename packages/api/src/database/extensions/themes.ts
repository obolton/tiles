import { Prisma } from "@/generated/prisma/client";
import { toHex } from "@/utils/arrays";

export default Prisma.defineExtension({
  name: "themes-extension",
  result: {
    theme: {
      colors: {
        needs: { backgroundColor: true, textColor: true, accentColor: true },
        compute: ({ backgroundColor, textColor, accentColor }) => ({
          background: toHex(backgroundColor),
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
        needs: { borderColor: true, borderRadius: true },
        compute: ({ borderColor, borderRadius }) => ({
          color: borderColor ? toHex(borderColor) : null,
          radius: borderRadius,
        }),
      },
    },
  },
});

import { Prisma } from "@/generated/prisma/client";
import { getProfileImageUrl } from "@/utils/cdn";

export default Prisma.defineExtension({
  name: "images-extension",
  result: {
    user: {
      imageUrl: {
        needs: { imageKey: true },
        compute({ imageKey }) {
          return imageKey ? getProfileImageUrl(imageKey) : null;
        },
      },
    },
  },
});

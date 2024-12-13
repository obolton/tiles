import { Prisma } from "@prisma/client";
import { getProfileImageUrl, getImageUrl } from "@/utils/cdn.ts";

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
    imageTile: {
      imageUrl: {
        needs: { imageKey: true },
        compute({ imageKey }) {
          return getImageUrl(imageKey);
        },
      },
    },
  },
});

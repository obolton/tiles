import { Prisma } from "@/generated/prisma/client";
import { getProfileImageUrl, getVideoImageUrl } from "@/utils/cdn";

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
    videoTile: {
      imageUrl: {
        needs: { id: true },
        compute({ id }) {
          return getVideoImageUrl(id);
        },
      },
    },
  },
});

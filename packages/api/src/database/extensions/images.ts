import { Prisma } from "@/generated/prisma/client";
import { getProfileImageUrl, getImageUrl, getVideoImageUrl } from "@/utils/cdn";

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
    page: {
      coverImageUrl: {
        needs: { coverImageKey: true },
        compute({ coverImageKey }) {
          return coverImageKey ? getImageUrl(coverImageKey) : null;
        },
      },
    },
    imageTile: {
      imageUrl: {
        needs: { imageId: true },
        compute({ imageId }) {
          return imageId ? getImageUrl(imageId) : null;
        },
      },
    },
    linkTile: {
      imageUrl: {
        needs: { imageId: true },
        compute({ imageId }) {
          return imageId ? getImageUrl(imageId) : null;
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

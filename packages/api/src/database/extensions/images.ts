import { Prisma } from "@prisma/client";
import {
  getProfileImageUrl,
  getImageUrl,
  getLinkImageUrl,
  getVideoImageUrl,
} from "@/utils/cdn.ts";

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
        needs: { imageKey: true },
        compute({ imageKey }) {
          return getImageUrl(imageKey);
        },
      },
    },
    textTile: {
      imageUrl: {
        needs: { backgroundImageKey: true },
        compute({ backgroundImageKey }) {
          return backgroundImageKey ? getImageUrl(backgroundImageKey) : null;
        },
      },
    },
    linkTile: {
      imageUrl: {
        needs: { id: true },
        compute({ id }) {
          return getLinkImageUrl(id);
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

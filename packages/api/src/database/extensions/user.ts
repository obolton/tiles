import { Prisma } from "@prisma/client";
import { getProfileImageUrl } from "@/utils/cdn.ts";

export default Prisma.defineExtension({
  name: "user-extension",
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

import { isSignedIn, getUserInfo, getCachedUserInfo } from "@/utils/sessions";
import { handleError } from "@/utils/errors";

import "@/elements/global";
import "@/utils/tooltips";

if (isSignedIn()) {
  const userInfo = getCachedUserInfo();

  if (!userInfo) {
    getUserInfo().catch((error) => handleError(error));
  }
}

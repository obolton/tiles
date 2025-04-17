import {
  isSignedIn,
  getUserInfo,
  getCachedUserInfo,
  signOut,
} from "@/utils/sessions";
import { handleError } from "@/utils/errors";
import client from "@/api/client";

import "@/elements/global";
import "@/utils/tooltips";

if (isSignedIn()) {
  const userInfo = getCachedUserInfo();

  if (!userInfo) {
    getUserInfo().catch((error) => handleError(error));
  }
}

const newPageButton = document.getElementById("new-page-button");
const signOutButton = document.getElementById("sign-out");

newPageButton?.addEventListener("click", () => {
  newPageButton.classList.add("pending");
  client.pages.create
    .mutate({ title: "New page" })
    .then(({ id }) => {
      newPageButton.classList.remove("pending");
      window.open(`/pages/${id}?edit=true`, "_blank");
    })
    .catch(handleError);
});

signOutButton?.addEventListener("click", async () => {
  await signOut();
  delete document.body.dataset.signedIn;
  window.location.href = "/";
});

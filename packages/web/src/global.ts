import { handleError } from "@/utils/errors";
import client from "@/api/client";

import "@/elements/global";
import "@/utils/tooltips";

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

addEventListener(
  "DOMContentLoaded",
  () => {
    delete document.body.dataset.disableTransitions;
  },
  { once: true },
);

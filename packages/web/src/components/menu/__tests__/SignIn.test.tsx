import { afterEach, describe, expect, test } from "vitest";
import { render } from "jsx/dom";
import SignIn from "../SignIn";

const PAGE_ID = "b8c96309-cc54-445b-a274-98b6be12c43f";

function renderSignIn(pathname: string) {
  history.replaceState(null, "", pathname);
  document.body.append(...render(<SignIn />));
  const link = document.getElementById("sign-in");
  if (!(link instanceof HTMLAnchorElement)) {
    throw new Error("Missing sign-in link");
  }
  return link;
}

afterEach(() => {
  document.body.replaceChildren();
  history.replaceState(null, "", "/");
});

describe("SignIn", () => {
  test("links to the sign-in page with the current page as destination", () => {
    const link = renderSignIn(`/pages/${PAGE_ID}`);
    expect(link.getAttribute("href")).toBe(`/sign-in?destination=pages%2F${PAGE_ID}`);
  });

  test("links to the sign-in page without a destination for other paths", () => {
    const link = renderSignIn("/");
    expect(link.getAttribute("href")).toBe("/sign-in");
  });
});

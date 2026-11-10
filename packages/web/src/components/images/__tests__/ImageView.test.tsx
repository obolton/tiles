import * as Y from "yjs";
import { afterEach, describe, expect, test, vi } from "vitest";
import { hydrate, render } from "jsx/dom";
import { renderToString } from "jsx/server";
import Editor from "@/editor/Editor";
import Image from "@/models/Image";
import ImageView from "../ImageView";
import styles from "../ImageView.module.css";
import { PAGE } from "@/test/fixtures/Page";

const editor = Editor.init(PAGE, new Y.Doc());

function createImage(): Image {
  return editor.page.createTile(
    Image.createMap({ imageId: "sample-image", size: { width: 1200, height: 800 } }),
    {},
  ) as Image;
}

function stubImageState(state: { complete: boolean; naturalWidth: number }) {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(state.complete);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(state.naturalWidth);
}

function figure() {
  const element = document.querySelector("figure");
  if (!element) {
    throw new Error("Missing figure");
  }
  return element;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("ImageView", () => {
  test("shows a placeholder until the image loads", () => {
    stubImageState({ complete: false, naturalWidth: 0 });
    document.body.append(...render(<ImageView image={createImage()} />));

    expect(figure().classList).toContain(styles.loading);

    figure().querySelector("img")?.dispatchEvent(new Event("load"));

    expect(figure().classList).not.toContain(styles.loading);
  });

  test("shows a server-rendered image that loaded before hydration", () => {
    const image = createImage();
    document.body.innerHTML = renderToString(<ImageView image={image} />);
    expect(figure().classList).toContain(styles.loading);

    // The load event has already fired by the time the listener is attached
    stubImageState({ complete: true, naturalWidth: 1200 });
    hydrate(<ImageView image={image} />, document.body);

    expect(figure().classList).not.toContain(styles.loading);
  });

  test("keeps the placeholder for a server-rendered image that failed to load", () => {
    const image = createImage();
    document.body.innerHTML = renderToString(<ImageView image={image} />);

    stubImageState({ complete: true, naturalWidth: 0 });
    hydrate(<ImageView image={image} />, document.body);

    expect(figure().classList).toContain(styles.loading);
  });
});

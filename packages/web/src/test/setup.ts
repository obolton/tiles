// oxlint-disable no-extend-native
import { vi } from "vitest";
import "fake-indexeddb/auto";
import DOMPoint from "./mocks/DOMPoint";
import ToggleEvent from "./mocks/ToggleEvent";
import DragEvent from "./mocks/DragEvent";
import CSS from "./mocks/CSS";
import FontFace from "./mocks/FontFace";
import IntersectionObserver from "./mocks/IntersectionObserver";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

vi.stubGlobal("DOMPoint", DOMPoint);
vi.stubGlobal("ToggleEvent", ToggleEvent);
vi.stubGlobal("DragEvent", DragEvent);
vi.stubGlobal("CSS", CSS);
vi.stubGlobal("FontFace", FontFace);
vi.stubGlobal("IntersectionObserver", IntersectionObserver);

Object.defineProperty(document, "fonts", {
  configurable: true,
  value: {
    add: vi.fn(),
    check: vi.fn().mockReturnValue(false),
  },
});

Element.prototype.scrollIntoView = vi.fn();

HTMLElement.prototype.showPopover = function () {
  const allowToggle = this.dispatchEvent(
    new ToggleEvent("beforetoggle", { oldState: "closed", newState: "open" }),
  );
  if (!allowToggle) {
    return;
  }
  this.setAttribute("open", "");
  this.dispatchEvent(new ToggleEvent("toggle", { oldState: "closed", newState: "open" }));
};

HTMLElement.prototype.hidePopover = function () {
  const allowToggle = this.dispatchEvent(
    new ToggleEvent("beforetoggle", { oldState: "open", newState: "closed" }),
  );
  if (!allowToggle) {
    return;
  }
  this.removeAttribute("open");
  this.dispatchEvent(new ToggleEvent("toggle", { oldState: "open", newState: "closed" }));
};

Object.defineProperty(ElementInternals.prototype, "states", {
  value: {
    add: () => {},
    delete: () => {},
    clear: () => {},
  },
});

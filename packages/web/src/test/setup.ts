// oxlint-disable no-extend-native
import { vi } from "vitest";
import DOMPoint from "./mocks/DOMPoint";
import ToggleEvent from "./mocks/ToggleEvent";
import DragEvent from "./mocks/DragEvent";

vi.stubGlobal("DOMPoint", DOMPoint);
vi.stubGlobal("ToggleEvent", ToggleEvent);
vi.stubGlobal("DragEvent", DragEvent);

Element.prototype.scrollIntoView = vi.fn();

HTMLElement.prototype.showPopover = function () {
  this.setAttribute("open", "");
  this.dispatchEvent(
    new ToggleEvent("toggle", { oldState: "closed", newState: "open" }),
  );
};

HTMLElement.prototype.hidePopover = function () {
  this.removeAttribute("open");
  this.dispatchEvent(
    new ToggleEvent("toggle", { oldState: "open", newState: "closed" }),
  );
};

Object.defineProperty(ElementInternals.prototype, "states", {
  value: {
    add: () => {},
    delete: () => {},
    clear: () => {},
  },
});

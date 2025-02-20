import { vi } from "vitest";
import DOMPoint from "./mocks/DOMPoint";
import ToggleEvent from "./mocks/ToggleEvent";

vi.stubGlobal("DOMPoint", DOMPoint);
vi.stubGlobal("ToggleEvent", ToggleEvent);

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

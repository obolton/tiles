import { vi } from "vitest";
import DOMPoint from "./mocks/DOMPoint";
import ToggleEvent from "./mocks/ToggleEvent";

vi.stubGlobal("DOMPoint", DOMPoint);
vi.stubGlobal("ToggleEvent", ToggleEvent);

Element.prototype.scrollIntoView = vi.fn();

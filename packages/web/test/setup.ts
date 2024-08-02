import { vi } from "vitest";
import DOMPoint from "./mocks/DOMPoint";

vi.stubGlobal("DOMPoint", DOMPoint);

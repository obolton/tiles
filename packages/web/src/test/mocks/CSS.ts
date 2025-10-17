import { vi } from "vitest";

const CSS = {
  registerProperty: vi.fn(),
  supports: vi.fn(() => true),
};

export default CSS;

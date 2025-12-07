import { vi } from "vitest";

const CSS: Pick<typeof globalThis.CSS, "registerProperty" | "supports"> = {
  registerProperty: vi.fn(),
  supports: vi.fn(() => true),
};

export default CSS;

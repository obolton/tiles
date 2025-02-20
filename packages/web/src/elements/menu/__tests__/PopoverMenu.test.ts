import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  vi,
  afterEach,
} from "vitest";
import PopoverMenu from "../PopoverMenu";

describe("PopoverMenu", () => {
  let menu: PopoverMenu;
  let button: HTMLElement;

  beforeAll(() => {
    customElements.define("popover-menu", PopoverMenu);
  });

  beforeEach(() => {
    menu = document.createElement("popover-menu") as PopoverMenu;
    menu.id = "menu";
    menu.setAttribute("anchor", "button");
    document.body.appendChild(menu);

    vi.spyOn(menu, "offsetWidth", "get").mockReturnValue(200);
    vi.spyOn(menu, "offsetHeight", "get").mockReturnValue(150);

    button = document.createElement("button");
    button.id = "button";
    button.setAttribute("popovertarget", menu.id);
    document.body.appendChild(button);

    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1000);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(1000);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("should initialize the popover attribute", () => {
    expect(menu.popover).toBe("auto");
  });

  describe("anchorElement", () => {
    it("should return the anchor element", () => {
      expect(menu.anchorElement).toBe(button);
    });

    it("should throw an error if the anchor attribute is missing", () => {
      menu.removeAttribute("anchor");
      expect(() => menu.anchorElement).toThrow("Missing anchor attribute");
    });

    it("should throw an error if the anchor element does not exist", () => {
      menu.setAttribute("anchor", "non-existent");
      expect(() => menu.anchorElement).toThrow(
        'Anchor element with ID "non-existent" not found',
      );
    });
  });

  describe("toggle handling", () => {
    it("should update the aria-expanded attribute of the trigger on toggle", () => {
      menu.showPopover();
      expect(button.getAttribute("aria-expanded")).toBe("true");

      menu.hidePopover();
      expect(button.getAttribute("aria-expanded")).toBe("false");
    });
  });

  describe("position", () => {
    it("should appear below and right of the anchor by default", () => {
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 100,
        right: 200,
        bottom: 120,
        left: 100,
        width: 100,
        height: 20,
      } as DOMRect);

      menu.showPopover();

      expect(menu.style.inset).toBe("120px auto auto 100px");
      expect(menu.style.transformOrigin).toBe("top left");
    });

    it("should appear left of anchor when space is unavailable on the right", () => {
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 100,
        right: 950,
        bottom: 120,
        left: 850,
        width: 100,
        height: 20,
      } as DOMRect);

      menu.showPopover();

      expect(menu.style.inset).toBe("120px 50px auto auto");
      expect(menu.style.transformOrigin).toBe("top right");
    });

    it("should appear above the anchor when space is unavailable below", () => {
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 970,
        right: 200,
        bottom: 990,
        left: 100,
        width: 100,
        height: 20,
      } as DOMRect);

      menu.showPopover();

      expect(menu.style.inset).toBe("auto auto 30px 100px");
      expect(menu.style.transformOrigin).toBe("bottom left");
    });
  });
});

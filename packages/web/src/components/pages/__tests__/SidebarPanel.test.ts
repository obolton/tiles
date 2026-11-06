import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import SidebarPanel, { PAGE_ACTIONS_BUTTON_ID } from "../SidebarPanel";

const PANEL_ID = "test-panel";
const BUTTON_ID = "test-button";

describe("SidebarPanel", () => {
  let panel: HTMLDivElement;
  let inner: HTMLButtonElement;
  let button: HTMLButtonElement;
  let other: HTMLButtonElement;

  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });
    panel = document.createElement("div");
    panel.id = PANEL_ID;
    inner = document.createElement("button");
    panel.append(inner);
    button = document.createElement("button");
    button.id = BUTTON_ID;
    other = document.createElement("button");
    document.body.append(panel, button, other);
  });

  afterEach(() => {
    panel.remove();
    button.remove();
    other.remove();
  });

  describe("open", () => {
    test("opens and focuses inside the panel", () => {
      const state = new SidebarPanel(PANEL_ID, BUTTON_ID);
      state.open();
      expect(state.isOpen.value).toBe(true);
      expect(document.activeElement).toBe(inner);
    });

    test("does nothing when already open", () => {
      const state = new SidebarPanel(PANEL_ID, BUTTON_ID);
      state.open();
      other.focus();
      state.open();
      expect(document.activeElement).toBe(other);
    });

    test("tolerates a missing panel element", () => {
      panel.remove();
      const state = new SidebarPanel(PANEL_ID, BUTTON_ID);
      expect(() => state.open()).not.toThrow();
      expect(state.isOpen.value).toBe(true);
    });
  });

  describe("close", () => {
    test("closes and returns focus to the button when focus was inside", () => {
      const state = new SidebarPanel(PANEL_ID, BUTTON_ID);
      state.open();
      state.close();
      expect(state.isOpen.value).toBe(false);
      expect(document.activeElement).toBe(button);
    });

    test("returns focus to the page actions button when the panel button is absent", () => {
      const more = document.createElement("button");
      more.id = PAGE_ACTIONS_BUTTON_ID;
      document.body.append(more);
      button.remove();
      const state = new SidebarPanel(PANEL_ID, BUTTON_ID);
      state.open();
      state.close();
      expect(document.activeElement).toBe(more);
      more.remove();
    });

    test("leaves focus alone when it was outside the panel", () => {
      const state = new SidebarPanel(PANEL_ID, BUTTON_ID);
      state.open();
      other.focus();
      state.close();
      expect(state.isOpen.value).toBe(false);
      expect(document.activeElement).toBe(other);
    });

    test("does nothing when already closed", () => {
      const state = new SidebarPanel(PANEL_ID, BUTTON_ID);
      other.focus();
      state.close();
      expect(state.isOpen.value).toBe(false);
      expect(document.activeElement).toBe(other);
    });
  });

  describe("toggle", () => {
    test("opens and closes", () => {
      const state = new SidebarPanel(PANEL_ID, BUTTON_ID);
      state.toggle();
      expect(state.isOpen.value).toBe(true);
      state.toggle();
      expect(state.isOpen.value).toBe(false);
    });
  });
});

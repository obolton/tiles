import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { reactive } from "carillon";
import SidebarPanel from "../SidebarPanel";

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

    test("leaves focus alone when the panel has no button", () => {
      const state = new SidebarPanel(PANEL_ID);
      state.open();
      state.close();
      expect(document.activeElement).not.toBe(button);
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

  describe("sidebar", () => {
    test("holds the open panel", () => {
      const sidebar = reactive<SidebarPanel | null>(null);
      const state = new SidebarPanel(PANEL_ID, BUTTON_ID, sidebar);
      state.open();
      expect(sidebar.value).toBe(state);
      state.close();
      expect(sidebar.value).toBeNull();
    });

    test("opening a panel closes the panel sharing its sidebar", () => {
      const sidebar = reactive<SidebarPanel | null>(null);
      const first = new SidebarPanel(PANEL_ID, BUTTON_ID, sidebar);
      const second = new SidebarPanel("other-panel", null, sidebar);
      const close = vi.spyOn(first, "close");
      first.open();

      second.open();

      expect(close).toHaveBeenCalledTimes(1);
      expect(first.isOpen.value).toBe(false);
      expect(second.isOpen.value).toBe(true);
    });

    test("closing a panel leaves another sidebar's panel open", () => {
      const first = new SidebarPanel(PANEL_ID, BUTTON_ID);
      const second = new SidebarPanel("other-panel");
      first.open();
      second.open();

      first.close();

      expect(second.isOpen.value).toBe(true);
    });
  });
});

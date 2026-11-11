import "@/styles";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "jsx/dom";
import { flag } from "carillon";
import ChatPanel from "../ChatPanel";
import { submitPrompt } from "@/utils/ai";
import { createEditor } from "@/test/editor";
import { createTextTile } from "@/test/fixtures/chat";
import type Editor from "@/editor/Editor";

vi.mock("@/utils/ai", () => ({
  submitPrompt: vi.fn(),
}));

const newChatButton = () => page.getByRole("button", { name: "New chat" });

let editor: Editor;

function renderPanel() {
  // The panel floats above its container, as it does above the create toolbar
  document.body.append(
    ...render(
      <div style={{ position: "fixed", insetInline: "16px", insetBlockEnd: "16px" }}>
        <ChatPanel isOpen={flag(true)} />
      </div>,
    ),
  );
}

beforeEach(() => {
  editor = createEditor();
});

afterEach(() => {
  document.body.replaceChildren();
  vi.mocked(submitPrompt).mockReset();
});

describe("ChatPanel", () => {
  describe("new chat", () => {
    test("is hidden while the chat is empty", () => {
      renderPanel();

      expect(newChatButton().query()).toBeNull();
    });

    test("clears the thread and focuses the prompt", async () => {
      editor.chat.addUserMessage("Summarize this page");
      renderPanel();

      await newChatButton().click();

      expect(editor.chat.hasMessages).toBe(false);
      expect(newChatButton().query()).toBeNull();
      await expect.element(page.getByRole("textbox", { name: "Ask anything" })).toHaveFocus();
    });

    test("keeps the attached references", async () => {
      editor.chat.addUserMessage("Summarize this page");
      const tileId = createTextTile(editor.page, "Quarterly summary");
      editor.toggleReference(tileId);
      renderPanel();

      await newChatButton().click();

      expect(editor.referenceIds).toEqual([tileId]);
    });

    test("is disabled until the response completes", async () => {
      const { promise, resolve } = Promise.withResolvers<void>();
      vi.mocked(submitPrompt).mockImplementation(() => {
        editor.chat.addUserMessage("Summarize this page");
        return promise;
      });
      renderPanel();
      const input = page.getByRole("textbox", { name: "Ask anything" });

      await input.fill("Summarize this page");
      await page.getByRole("button", { name: "Send" }).click();

      await expect.element(newChatButton()).toBeDisabled();
      resolve();
      await expect.element(newChatButton()).toBeEnabled();
    });
  });
});

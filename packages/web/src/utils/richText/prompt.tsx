import { Plugin, PluginKey, type EditorState } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import InlinePrompt from "@/components/prompt/InlinePrompt";
import { render } from "@/jsx/dom";
import { insertFromStream } from "@/utils/richText/stream";
import client from "@/api/client";
import { SPRING } from "@/utils/animation/effects";
import type { EditorView } from "prosemirror-view";
import type Editor from "@/editor/Editor";

export const PROMPT_PLUGIN_KEY = new PluginKey<DecorationSet | null>(
  "prompt-plugin",
);

export interface PromptMeta {
  pos: number | null;
}

function getElement(editor: Editor, view: EditorView) {
  function removePrompt() {
    const prompt = element.firstElementChild! as HTMLFormElement;
    void prompt
      .animate([{ opacity: 0 }], SPRING)
      .finished.finally(() =>
        view.dispatch(view.state.tr.setMeta(PROMPT_PLUGIN_KEY, { pos: null })),
      );

    view.focus();
  }

  async function onSubmit(prompt: string) {
    const pageId = document.body.dataset.pageId;
    if (!pageId) {
      throw new Error("Page ID is not defined");
    }
    const sectionId =
      element.closest<HTMLElement>("[data-section-id]")?.dataset.sectionId;
    if (!sectionId) {
      throw new Error("Section ID is not defined");
    }
    const {
      state: { doc, selection },
    } = view;
    const { from, to } = selection;
    const context = doc.textBetween(from, to, "\n");
    const tileIds = editor.selection.value
      .values()
      .map((tile) => tile.placementId)
      .toArray();
    const stream = await client.ai.write.mutate(
      { pageId, sectionId, prompt, context: { text: context, tileIds } },
      { context: { stream: true } },
    );
    await insertFromStream(view, stream, editor);
    removePrompt();
  }

  const element = render(
    <InlinePrompt
      placeholder="Ask anything"
      onSubmit={onSubmit}
      onCancel={removePrompt}
    />,
  ) as HTMLElement;

  requestAnimationFrame(() => {
    const prompt = element.firstElementChild! as HTMLFormElement;
    prompt.showPopover();
    prompt.querySelector("textarea")?.focus();
    const style = getComputedStyle(prompt);
    prompt.animate(
      [
        { width: 0, opacity: 0 },
        { width: style.width, opacity: 1 },
      ],
      SPRING,
    );
  });

  return element;
}

export function isPromptOpen(state: EditorState) {
  return Boolean(PROMPT_PLUGIN_KEY.getState(state));
}

export function prompt(editor: Editor) {
  return new Plugin<DecorationSet | null>({
    key: PROMPT_PLUGIN_KEY,

    state: {
      init() {
        return null;
      },

      apply(tr, decorations) {
        const meta = tr.getMeta(PROMPT_PLUGIN_KEY) as PromptMeta | undefined;

        if (!meta) {
          return decorations?.map(tr.mapping, tr.doc) ?? null;
        }

        if (meta.pos === null) {
          return null;
        } else {
          const { selection } = tr;
          const contextDecoration = Decoration.inline(
            selection.from,
            selection.to,
            {
              class: "context",
            },
          );
          const promptDecoration = Decoration.widget(
            meta.pos,
            (view) => getElement(editor, view),
            {
              ignoreSelection: true,

              // Prevent the editor from handling events from the prompt
              stopEvent() {
                return true;
              },
            },
          );
          return DecorationSet.create(tr.doc, [
            contextDecoration,
            promptDecoration,
          ]);
        }
      },
    },

    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}

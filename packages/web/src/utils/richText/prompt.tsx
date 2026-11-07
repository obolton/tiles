import { Plugin, type EditorState } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import InlinePrompt from "@/components/prompt/InlinePrompt";
import { render } from "jsx/dom";
import client from "@/api/client";
import { BODY_ID } from "doc/body";
import { SPRING } from "@/utils/animation/effects";
import Editor from "@/editor/Editor";
import { serializeSelection } from "./selection";
import { PROMPT_PLUGIN_KEY } from "./pluginKeys";
import type { EditorView } from "prosemirror-view";

export interface PromptMeta {
  pos: number | null;
}

function getElement(view: EditorView) {
  const editor = Editor.current;

  function removePrompt() {
    editor.isPromptOpen.value = false;
    editor.clearReferences();

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
    const {
      state: { doc, selection },
    } = view;
    const { from, to } = selection;
    const context = doc.textBetween(from, to, "\n");
    const tileIds = editor.referenceIds;
    const sectionId = editor.activeSection?.id ?? null;
    const range = serializeSelection(view.state);
    const tileId =
      view.dom.closest("page-item")?.id ?? (view.dom.closest("[data-body]") ? BODY_ID : undefined);
    const stream = await client.ai.write.mutate(
      {
        pageId,
        sectionId,
        prompt,
        context: { text: context, tileIds },
        selection: range && tileId ? { tileId, ...range } : undefined,
      },
      { context: { stream: true } },
    );
    // TODO: Chat messages are ignored for now
    for await (const event of stream) {
      void event;
    }
    removePrompt();
  }

  const element = render(
    <InlinePrompt placeholder="Ask anything" onSubmit={onSubmit} onCancel={removePrompt} />,
  )[0] as HTMLElement;

  requestAnimationFrame(() => {
    editor.isPromptOpen.value = true;

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

export function prompt() {
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
          const contextDecoration = Decoration.inline(selection.from, selection.to, {
            class: "context",
          });
          const promptDecoration = Decoration.widget(meta.pos, getElement, {
            ignoreSelection: true,

            // Prevent the editor from handling events from the prompt
            stopEvent() {
              return true;
            },
          });
          return DecorationSet.create(tr.doc, [contextDecoration, promptDecoration]);
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

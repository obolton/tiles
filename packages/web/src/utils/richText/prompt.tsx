import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import InlinePrompt from "@/components/prompt/InlinePrompt";
import { render } from "@/jsx/dom";
import { insertFromStream } from "@/utils/richText/stream";
import client from "@/api/client";
import type { EditorView } from "prosemirror-view";

export const PROMPT_PLUGIN_KEY = new PluginKey<DecorationSet | null>(
  "prompt-plugin",
);

export interface PromptMeta {
  pos: number | null;
}

function getElement(view: EditorView) {
  function removePrompt() {
    view.dispatch(view.state.tr.setMeta(PROMPT_PLUGIN_KEY, { pos: null }));
    view.focus();
  }

  async function onSubmit(prompt: string) {
    const pageId = document.body.dataset.pageId;
    if (!pageId) {
      throw new Error("Page ID is not defined");
    }
    const stream = await client.ai.write.mutate(
      { pageId, prompt },
      { context: { stream: true } },
    );
    removePrompt();
    await insertFromStream(view, stream);
  }

  const element = render(
    <InlinePrompt
      placeholder="Ask anything"
      onSubmit={onSubmit}
      onCancel={removePrompt}
    />,
  ) as HTMLElement;

  requestAnimationFrame(() => element.querySelector("textarea")?.focus());

  return element;
}

export function prompt(callback?: (isOpen: boolean) => void) {
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
          callback?.(false);
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
          const promptDecoration = Decoration.widget(meta.pos, getElement, {
            ignoreSelection: true,

            // Prevent the editor from handling events from the prompt
            stopEvent() {
              return true;
            },
          });
          callback?.(true);
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

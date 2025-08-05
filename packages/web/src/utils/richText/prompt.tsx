import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import Prompt from "@/components/prompt/Prompt";
import { render } from "@/jsx/dom";
import { insertFromStream } from "@/utils/richText/stream";
import client from "@/api/client";
import type { EditorView } from "prosemirror-view";

export const PROMPT_PLUGIN_KEY = new PluginKey("prompt-plugin");

export interface PromptMeta {
  pos: number | null;
}

function getElement(view: EditorView) {
  async function onSubmit(prompt: string) {
    const pageId = document.body.dataset.pageId;
    if (!pageId) {
      throw new Error("Page ID is not defined");
    }
    const stream = await client.ai.write.mutate(
      { pageId, prompt },
      { context: { stream: true } },
    );
    view.dispatch(view.state.tr.setMeta(PROMPT_PLUGIN_KEY, { pos: null }));
    await insertFromStream(view, stream);
  }

  const element = render(
    <Prompt placeholder="Ask anything" onSubmit={onSubmit} />,
  ) as HTMLElement;

  requestAnimationFrame(() => element.querySelector("textarea")?.focus());

  return element;
}

export function prompt() {
  return new Plugin({
    key: PROMPT_PLUGIN_KEY,

    state: {
      init() {
        return DecorationSet.empty;
      },

      apply(tr, decorations) {
        const meta = tr.getMeta(PROMPT_PLUGIN_KEY) as PromptMeta | undefined;

        if (!meta) {
          return decorations.map(tr.mapping, tr.doc);
        }

        if (meta.pos === null) {
          return DecorationSet.empty;
        } else {
          const decoration = Decoration.widget(meta.pos, getElement, {
            ignoreSelection: true,
          });
          return DecorationSet.create(tr.doc, [decoration]);
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

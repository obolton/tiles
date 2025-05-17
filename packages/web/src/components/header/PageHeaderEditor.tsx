import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { EditorState } from "prosemirror-state";
import { headerSchema } from "@/utils/richText/schema";
import type { StoreInterface } from "@/utils/reactivity";
import type { JSX } from "@/jsx/jsx";

interface PageHeaderEditorProps
  extends Omit<JSX.Attributes<HTMLDivElement>, "onBlur" | "title"> {
  title: StoreInterface<string>;
  subtitle: StoreInterface<string | null>;
  onBlur?: (title: string, subtitle?: string) => void;
  signal?: AbortSignal;
}

function createDocument(title: string, subtitle: string | null) {
  const nodes = [
    headerSchema.nodes.heading.create(null, headerSchema.text(title)),
  ];
  if (subtitle) {
    nodes.push(
      headerSchema.nodes.paragraph.create(null, headerSchema.text(subtitle)),
    );
  }
  return headerSchema.nodes.doc.create(null, nodes);
}

export default function PageHeaderEditor({
  title,
  subtitle,
  onBlur,
  signal,
  ...props
}: PageHeaderEditorProps) {
  let editorView: EditorView | undefined;

  signal?.addEventListener(
    "abort",
    () => requestAnimationFrame(() => editorView?.destroy()),
    { once: true },
  );

  const ref = (element: HTMLElement) => {
    editorView = new EditorView(
      { mount: element },
      {
        state: EditorState.create({
          doc: createDocument(title.value, subtitle.value),
        }),
        plugins: [keymap(baseKeymap)],
      },
    );
  };

  const handleBlur = () => {
    const state = editorView?.state;
    if (state && onBlur) {
      const title = state.doc.firstChild?.textContent || "";
      const subtitle = state.doc.maybeChild(1)?.textContent;
      onBlur(title, subtitle);
    }
  };

  return <div ref={ref} role="textbox" {...props} onblur={handleBlur} />;
}

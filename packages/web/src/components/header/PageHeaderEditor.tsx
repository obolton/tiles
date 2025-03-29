import { useCallback, useRef } from "react";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { EditorState } from "prosemirror-state";
import { headerSchema } from "@/utils/richText/schema";

interface PageHeaderEditorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onBlur"> {
  title: string;
  subtitle: string | null;
  onBlur?: (title: string, subtitle?: string) => void;
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
  ...props
}: PageHeaderEditorProps) {
  const editorViewRef = useRef<EditorView>(null);

  const refCallback = useCallback((element: HTMLElement | null) => {
    if (element) {
      editorViewRef.current = new EditorView(
        { mount: element },
        {
          state: EditorState.create({
            doc: createDocument(title, subtitle),
          }),
          plugins: [keymap(baseKeymap)],
        },
      );
    } else {
      handleBlur();
      editorViewRef.current?.destroy();
      editorViewRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBlur = useCallback(() => {
    const state = editorViewRef.current?.state;
    if (state && onBlur) {
      const title = state.doc.firstChild?.textContent || "";
      const subtitle = state.doc.maybeChild(1)?.textContent;
      onBlur(title, subtitle);
    }
  }, [onBlur]);

  return <div ref={refCallback} {...props} onBlur={handleBlur} />;
}

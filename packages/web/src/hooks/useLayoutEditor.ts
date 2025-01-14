import { useEffect, useRef } from "react";
import LayoutEditor from "@/editor/LayoutEditor";
import { useEditor } from "@/context/editor";

export default function useLayoutEditor(
  ref: React.RefObject<HTMLElement | null>,
  collectionId: string | null = null,
) {
  const layoutEditorRef = useRef<LayoutEditor>(null);
  const editor = useEditor();

  useEffect(() => {
    if (ref.current) {
      layoutEditorRef.current ??= new LayoutEditor({
        element: ref.current,
        editor,
        collectionId,
      });
    }
    return () => {
      layoutEditorRef.current?.disconnect();
      layoutEditorRef.current = null;
    };
  }, [collectionId, editor, ref]);
}

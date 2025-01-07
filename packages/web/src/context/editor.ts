import { createContext, useContext } from "react";
import type Editor from "@/editor/editor";

export const EditorContext = createContext<Editor | null>(null);
EditorContext.displayName = "EditorContext";

export function useEditor() {
  const editor = useContext(EditorContext);
  if (!editor) {
    throw new Error("EditorContext is not provided.");
  }
  return editor;
}

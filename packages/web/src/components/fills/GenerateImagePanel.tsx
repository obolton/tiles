import Prompt from "@/components/prompt/Prompt";
import { generateImage } from "@/utils/ai";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import type { ImageFill } from "./types";

export interface GenerateImagePanelProps {
  onChange: (value: ImageFill) => void;
}

export default function GenerateImagePanel({ onChange }: GenerateImagePanelProps) {
  function onSubmit(prompt: string) {
    return generateImage(prompt, Editor.current.workspaceId)
      .then(({ id }) => onChange({ type: "image", imageId: id }))
      .catch(handleError);
  }

  return <Prompt placeholder="Describe an image" onSubmit={onSubmit} />;
}

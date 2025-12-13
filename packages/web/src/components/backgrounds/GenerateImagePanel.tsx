import Prompt from "@/components/prompt/Prompt";
import { generateImage } from "@/utils/ai";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import type { ImageFillUpdate } from "./types";

export interface GenerateImagePanelProps {
  onChange: (value: ImageFillUpdate) => void;
}

export default function GenerateImagePanel({
  onChange,
}: GenerateImagePanelProps) {
  function onSubmit(prompt: string) {
    return generateImage(prompt, Editor.current.workspaceId)
      .then((imageId) => onChange({ type: "image", imageId }))
      .catch(handleError);
  }

  return <Prompt placeholder="Describe an image" onSubmit={onSubmit} />;
}

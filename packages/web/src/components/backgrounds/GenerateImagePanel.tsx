import Prompt from "@/components/prompt/Prompt";
import { generateImage } from "@/utils/ai";
import { handleError } from "@/utils/errors";
import type { ImageBackground } from "./types";

export interface GenerateImagePanelProps {
  onChange: (background: ImageBackground) => void;
}

export default function GenerateImagePanel({
  onChange,
}: GenerateImagePanelProps) {
  function onSubmit(prompt: string) {
    return generateImage(prompt)
      .then((imageKey) => onChange({ type: "image", imageKey }))
      .catch(handleError);
  }

  return <Prompt placeholder="Describe an image" onSubmit={onSubmit} />;
}

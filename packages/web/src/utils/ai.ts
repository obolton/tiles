import client from "@/api/client";
import { uploadMedia } from "@/utils/media";

export async function generateImage(prompt: string) {
  const { data, type } = await client.ai.generateImage.mutate({ prompt });
  const url = "data:" + type + ";base64," + data;
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], "generated-image.png", { type });
  return uploadMedia(file, "image");
}

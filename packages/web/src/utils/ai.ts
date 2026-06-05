import client from "@/api/client";
import { uploadMedia } from "@/utils/media";
import Editor from "@/editor/Editor";

export async function generateImage(prompt: string, workspaceId: string) {
  const { data, type } = await client.ai.generateImage.mutate({ prompt });
  const url = "data:" + type + ";base64," + data;
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], "generated-image.png", { type });
  return uploadMedia({ file, purpose: "content", workspaceId });
}

export async function submitPrompt(prompt: string) {
  const editor = Editor.current;
  const { chat } = editor;
  const pageId = editor.pageId;
  const sectionId = editor.activeSection?.id ?? null;
  const tileIds = editor.references.value.map((tile) => tile.id);
  const history = chat.hasMessages ? chat.getHistory() : undefined;

  chat.addUserMessage(prompt);

  const stream = await client.ai.write.mutate(
    { pageId, sectionId, prompt, context: { tileIds }, history },
    { context: { stream: true } },
  );

  chat.beginStreaming();

  try {
    for await (const event of stream) {
      if ("message" in event) {
        chat.append(event.message);
      } else {
        chat.addReference(event.reference);
      }
    }
  } finally {
    chat.completeStreaming();
  }
}

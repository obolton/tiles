import ModalBody from "../ModalBody";
import ModalFooter from "../ModalFooter";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import Placeholder from "@/components/placeholder/Placeholder";
import client from "@/api/client";
import styles from "./GenerateImage.module.css";
import { ReactiveValue } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";

interface GenerateImageProps {
  confirm: ({ image }: { image: File }) => void;
  cancel: () => void;
}

export default function GenerateImage({ confirm, cancel }: GenerateImageProps) {
  const isPending = new ReactiveValue(false);
  const isGenerationPending = new ReactiveValue(false);
  const file = new ReactiveValue<File | undefined>(undefined);
  const imageUrl = new ReactiveValue<string | undefined>(undefined);

  const generate = async (event: MouseEvent) => {
    try {
      const button = event.currentTarget as HTMLButtonElement;
      const form = button.form;
      if (!form) {
        throw new Error("Cannot find form element");
      }
      const formData = new FormData(form);
      const prompt = formData.get("prompt") as string;
      isGenerationPending.value = true;
      const { data, type } = await client.ai.generateImage.mutate({
        prompt,
      });
      const url = `data:${type};base64,${data}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const newFile = new File([blob], "generated-image.png", { type });
      file.value = newFile;
      imageUrl.value = url;
    } catch (error) {
      handleError(error);
    } finally {
      isGenerationPending.value = false;
    }
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    if (isPending.value || !file.value) {
      return;
    }
    isPending.value = true;
    try {
      confirm({ image: file.value });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.value = false;
    }
  };

  return (
    <form on:submit={onSubmit}>
      <ModalBody>
        <section className={styles.generation}>
          <div>
            <ResizingTextarea
              className={styles.textarea}
              autofocus
              name="prompt"
              placeholder="Describe an image"
              rows={3}
            />

            <button
              type="button"
              classList={{
                secondary: true,
                pending: isGenerationPending,
              }}
              on:click={generate}
              data-pending-text="Generating&hellip;"
            >
              Generate
            </button>
          </div>

          <div>
            {imageUrl.derive((url) =>
              url ? (
                <img className={styles.image} src={imageUrl} alt="The generated image" />
              ) : (
                <Placeholder className={styles.placeholder} />
              ),
            )}
          </div>
        </section>
      </ModalBody>

      <ModalFooter>
        <button
          classList={{ primary: true, pending: isPending }}
          type="submit"
          aria-disabled={!file}
        >
          Save
        </button>

        <button className="secondary" type="button" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

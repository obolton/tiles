import { useCallback, useState, useTransition } from "react";
import ModalBody from "../ModalBody";
import ModalFooter from "../ModalFooter";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import Placeholder from "@/components/placeholder/Placeholder";
import { classNames } from "@/utils/css";
import client from "@/api/client";
import styles from "./GenerateImage.module.css";

interface GenerateImageProps {
  confirm: ({ image }: { image: File }) => void;
  cancel: () => void;
}

export default function GenerateImage({ confirm, cancel }: GenerateImageProps) {
  const [isPending, startTransition] = useTransition();
  const [isGenerationPending, startGenerationTransition] = useTransition();
  const [file, setFile] = useState<File | undefined>();
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  const generate = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.form;
    if (!form) {
      throw new Error("Cannot find form element");
    }
    const formData = new FormData(form);
    const prompt = formData.get("prompt") as string;
    startGenerationTransition(async () => {
      const { data, type } = await client.ai.generateImage.mutate({
        prompt,
      });
      const url = `data:${type};base64,${data}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], "generated-image.png", { type });
      setFile(file);
      setImageUrl(url);
    });
  }, []);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isPending || !file) {
        return;
      }
      startTransition(() => confirm({ image: file }));
    },
    [isPending, confirm, file],
  );

  return (
    <form onSubmit={onSubmit}>
      <ModalBody>
        <section className={styles.generation}>
          <div>
            <ResizingTextarea
              className={styles.textarea}
              autoFocus
              name="prompt"
              placeholder="Describe an image"
              rows={3}
            />

            <button
              type="button"
              className={classNames(
                "secondary",
                isGenerationPending && "pending",
              )}
              onClick={generate}
              data-pending-text="Generating&hellip;"
            >
              Generate
            </button>
          </div>

          <div>
            {imageUrl ? (
              <img
                className={styles.image}
                src={imageUrl}
                alt="The generated image"
              />
            ) : (
              <Placeholder className={styles.placeholder} />
            )}
          </div>
        </section>
      </ModalBody>

      <ModalFooter>
        <button
          className={classNames("primary", isPending && "pending")}
          type="submit"
          aria-disabled={!file}
        >
          Save
        </button>

        <button className="secondary" type="button" onClick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

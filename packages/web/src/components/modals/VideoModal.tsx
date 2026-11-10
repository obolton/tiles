import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import styles from "./VideoModal.module.css";
import { handleError } from "@/utils/errors";
import { UnsupportedVideoError } from "@/models/Video";
import { flag } from "carillon";
import type { ModalProps } from "@/utils/modals";

export interface VideoModalResult {
  url: string;
}

export type VideoModalProps = ModalProps<VideoModalResult>;

function onInput(event: Event) {
  (event.currentTarget as HTMLInputElement).setCustomValidity("");
}

export default function VideoModal({ cancel, confirm }: VideoModalProps) {
  const isPending = flag(false);

  async function submit(event: Event) {
    const form = event.currentTarget as HTMLFormElement;
    event.preventDefault();

    const input = form.elements.namedItem("url");
    if (isPending.value || !(input instanceof HTMLInputElement)) {
      return;
    }

    isPending.on();
    try {
      await confirm({ url: input.value });
    } catch (error) {
      if (error instanceof UnsupportedVideoError) {
        input.setCustomValidity("Enter a link to a YouTube or Vimeo video.");
        input.reportValidity();
      } else {
        handleError(error);
      }
    } finally {
      isPending.off();
    }
  }

  return (
    <form on:submit={submit}>
      <ModalHeader>
        <h2>Add a video</h2>
      </ModalHeader>

      <ModalBody>
        <p className={styles.field}>
          <label>
            Video URL
            <input
              id="video-url"
              type="url"
              name="url"
              className={styles.input}
              placeholder="Enter a YouTube or Vimeo URL"
              autofocus
              required
              aria-describedby="video-url-error"
              on:input={onInput}
            />
          </label>
          <form-error id="video-url-error" for="video-url" />
        </p>
      </ModalBody>

      <ModalFooter>
        <button type="submit" classList={{ primary: true, pending: isPending }}>
          Save
        </button>
        <button type="button" className="secondary" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

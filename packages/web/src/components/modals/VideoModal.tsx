import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import styles from "./VideoModal.module.css";
import { handleError } from "@/utils/errors";
import { parseVideoUrl } from "doc/videos";
import { flag } from "reactivity";
import type { ModalProps } from "@/utils/modals";

export interface VideoModalResult {
  url: string;
}

export type VideoModalProps = ModalProps<VideoModalResult>;

const HINT = "Supports YouTube and Vimeo links.";
const INVALID_MESSAGE = "Enter a link to a YouTube or Vimeo video.";

export default function VideoModal({ cancel, confirm }: VideoModalProps) {
  const isPending = flag(false);
  const isInvalid = flag(false);

  function onInput() {
    isInvalid.off();
  }

  async function submit(event: Event) {
    const form = event.currentTarget as HTMLFormElement;
    event.preventDefault();

    const formData = new FormData(form);
    const url = (formData.get("url") as string).trim();

    if (isPending.value || !url) {
      return;
    }

    if (!parseVideoUrl(url)) {
      isInvalid.on();
      const input = form.elements.namedItem("url");
      if (input instanceof HTMLInputElement) {
        input.focus();
      }
      return;
    }

    isPending.on();
    try {
      await confirm({ url });
    } catch (error) {
      handleError(error);
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
        <div className={styles.field}>
          <label>
            Video URL
            <input
              type="url"
              name="url"
              className={styles.input}
              placeholder="Enter a video URL"
              autofocus
              required
              aria-describedby="video-url-hint"
              aria-invalid={isInvalid}
              on:input={onInput}
            />
          </label>
          <p
            id="video-url-hint"
            classList={{ [styles.hint]: true, [styles.error]: isInvalid }}
            aria-live="polite"
          >
            {isInvalid.derive((invalid) => (invalid ? INVALID_MESSAGE : HINT))}
          </p>
        </div>
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

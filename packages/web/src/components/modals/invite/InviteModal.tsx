import ModalHeader from "../ModalHeader";
import ModalBody from "../ModalBody";
import ModalFooter from "../ModalFooter";
import { flag } from "reactivity";
import { handleError } from "@/utils/errors";
import styles from "./InviteModal.module.css";
import type { ModalProps } from "@/utils/modals";

export interface InviteModalResult {
  /** The address to send the invite to, or `undefined` for a link-only invite. */
  email?: string;
}

export interface InviteModalProps extends ModalProps<InviteModalResult> {
  title?: string;
}

export default function InviteModal({ title = "Invite", cancel, confirm }: InviteModalProps) {
  const isPending = flag(false);

  async function onSubmit(event: Event) {
    const form = event.currentTarget as HTMLFormElement;
    event.preventDefault();

    if (isPending.value) {
      return;
    }

    const formData = new FormData(form);
    const email = formData.get("email");
    isPending.on();

    try {
      await confirm({ email: typeof email === "string" && email ? email : undefined });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.off();
    }
  }

  return (
    <form on:submit={onSubmit}>
      <ModalHeader>
        <h2>{title}</h2>
      </ModalHeader>

      <ModalBody>
        <div className={styles.field}>
          <label>
            Email address (optional)
            <input
              type="email"
              name="email"
              placeholder="Email address"
              aria-describedby="invite-email-hint"
              autofocus
            />
          </label>
          <p id="invite-email-hint" className={styles.hint}>
            An invite link is created that you can copy and share. Add an email address to send the
            link to someone directly.
          </p>
        </div>
      </ModalBody>

      <ModalFooter>
        <button type="submit" classList={{ primary: true, pending: isPending }}>
          Create invite
        </button>
        <button type="button" className="secondary" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

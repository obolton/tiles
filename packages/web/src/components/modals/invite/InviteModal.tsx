import ModalHeader from "../ModalHeader";
import ModalBody from "../ModalBody";
import ModalFooter from "../ModalFooter";
import { flag } from "reactivity";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";

export interface InviteModalResult {
  email: string;
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
    const email = formData.get("email") as string;
    isPending.on();

    try {
      await confirm({ email });
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
        <label>
          Email address
          <input type="email" name="email" placeholder="Email address" required />
        </label>
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

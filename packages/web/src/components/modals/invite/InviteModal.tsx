import ModalHeader from "../ModalHeader";
import ModalBody from "../ModalBody";
import ModalFooter from "../ModalFooter";
import type { ModalProps } from "@/utils/modals";
import { ReactiveValue } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";

export interface InviteModalResult {
  email: string;
}

type InviteModalProps = ModalProps<InviteModalResult>;

export default function InviteModal({ cancel, confirm }: InviteModalProps) {
  const isPending = new ReactiveValue(false);

  const submit = async (event: Event) => {
    const form = event.currentTarget as HTMLFormElement;
    event.preventDefault();

    if (isPending.value) {
      return;
    }

    const formData = new FormData(form);
    const email = formData.get("email") as string;
    isPending.value = true;
    try {
      await confirm({ email });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.value = false;
    }
  };

  return (
    <form onSubmit={submit}>
      <ModalHeader>
        <h2>Invite to page</h2>
      </ModalHeader>

      <ModalBody>
        <label>
          Email address
          <input
            type="email"
            name="email"
            placeholder="Email address"
            required
          />
        </label>
      </ModalBody>

      <ModalFooter>
        <button classList={{ primary: true, pending: isPending }} type="submit">
          Save
        </button>
        <button className="secondary" type="button" onclick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

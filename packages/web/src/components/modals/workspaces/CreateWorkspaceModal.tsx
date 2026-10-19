import ModalHeader from "@/components/modals/ModalHeader";
import ModalBody from "@/components/modals/ModalBody";
import ModalFooter from "@/components/modals/ModalFooter";
import { flag } from "reactivity";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";

export interface CreateWorkspaceModalResult {
  name: string;
}

export type CreateWorkspaceModalProps = ModalProps<CreateWorkspaceModalResult>;

export default function CreateWorkspaceModal({ cancel, confirm }: CreateWorkspaceModalProps) {
  const pending = flag(false);

  async function onSubmit(event: Event) {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get("name") as string;

    if (pending.value || !name) {
      return;
    }

    pending.on();
    try {
      await confirm({ name });
    } catch (error) {
      handleError(error);
    } finally {
      pending.off();
    }
  }

  return (
    <form on:submit={onSubmit}>
      <ModalHeader>
        <h2>Create workspace</h2>
      </ModalHeader>

      <ModalBody>
        <label>
          Name
          <input type="text" name="name" placeholder="Workspace name" autofocus required />
        </label>
      </ModalBody>

      <ModalFooter>
        <button type="submit" classList={{ primary: true, pending }}>
          Save
        </button>
        <button type="button" className="secondary" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

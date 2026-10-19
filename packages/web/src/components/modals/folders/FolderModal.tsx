import ModalHeader from "@/components/modals/ModalHeader";
import ModalBody from "@/components/modals/ModalBody";
import ModalFooter from "@/components/modals/ModalFooter";
import { flag } from "reactivity";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";

export type FolderModalResult = { name: string } | "DELETE";

export interface FolderModalProps extends ModalProps<FolderModalResult> {
  name?: string;
  showDelete?: boolean;
}

export default function FolderModal({ cancel, confirm, name, showDelete }: FolderModalProps) {
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

  async function onDelete() {
    if (pending.value) {
      return;
    }

    pending.on();
    try {
      await confirm("DELETE");
    } catch (error) {
      handleError(error);
    } finally {
      pending.off();
    }
  }

  return (
    <form on:submit={onSubmit}>
      <ModalHeader>
        <h2>Folder</h2>
      </ModalHeader>

      <ModalBody>
        <label>
          Name
          <input
            type="text"
            name="name"
            placeholder="Folder name"
            autofocus
            required
            value={name}
          />
        </label>
      </ModalBody>

      <ModalFooter>
        <button type="submit" classList={{ primary: true, pending }}>
          Save
        </button>
        {showDelete ? (
          <button type="button" className="secondary destructive" on:click={onDelete}>
            Delete folder
          </button>
        ) : null}
        <button type="button" className="secondary" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

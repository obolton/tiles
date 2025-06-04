import ModalHeader from "@/components/modals/ModalHeader";
import ModalBody from "@/components/modals/ModalBody";
import ModalFooter from "@/components/modals/ModalFooter";
import { flag } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";

export type FolderModalResult = { name: string } | "DELETE";

export interface FolderModalProps extends ModalProps<FolderModalResult> {
  name?: string;
  showDelete?: boolean;
}

export default function FolderModal({
  cancel,
  confirm,
  name,
  showDelete,
}: FolderModalProps) {
  const isPending = flag(false);

  async function onSubmit(event: Event) {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get("name") as string;

    if (isPending.value || !name) {
      return;
    }

    isPending.on();
    try {
      await confirm({ name });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.off();
    }
  }

  async function onDelete() {
    if (isPending.value) {
      return;
    }

    isPending.on();
    try {
      await confirm("DELETE");
    } catch (error) {
      handleError(error);
    } finally {
      isPending.off();
    }
  }

  return (
    <form onsubmit={onSubmit}>
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
        <button classList={{ primary: true, pending: isPending }} type="submit">
          Save
        </button>
        {showDelete ? (
          <button
            className="secondary destructive"
            type="button"
            onclick={onDelete}
          >
            Delete folder
          </button>
        ) : null}
        <button className="secondary" type="button" onclick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

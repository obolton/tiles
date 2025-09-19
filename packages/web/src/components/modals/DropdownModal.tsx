import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import Each from "@/jsx/each";
import { flag, reactive } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import type { Color } from "@/utils/color";
import type { ModalProps } from "@/utils/modals";

export interface DropdownOption {
  value: string;
  color?: Color;
}

export interface DropdownModalResult {
  options: DropdownOption[];
}

export interface DropdownModalProps extends ModalProps<DropdownModalResult> {
  options?: DropdownOption[];
}

export default function DropdownModal({
  confirm,
  cancel,
  options: initialOptions,
}: DropdownModalProps) {
  const pending = flag(false);
  const options = reactive(initialOptions ?? []);

  async function onSubmit(event: Event) {
    event.preventDefault();

    pending.on();
    try {
      await confirm({ options: options.value });
    } catch (error) {
      handleError(error);
    } finally {
      pending.off();
    }
  }

  return (
    <form on:submit={onSubmit}>
      <ModalHeader>
        <h2>Dropdown</h2>
      </ModalHeader>

      <ModalBody>
        <fieldset name="options">
          <Each items={options}>
            {(item) => <input type="text" name="option" value={item.value} />}
          </Each>
        </fieldset>
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

import ModalHeader from "@/components/modals/ModalHeader";
import ModalBody from "@/components/modals/ModalBody";
import ModalFooter from "@/components/modals/ModalFooter";
import Each from "@/jsx/each";
import DropdownOptionRow, { type DropdownOption } from "./DropdownOptionRow";
import NewIcon from "@/icons/new.svg?jsx";
import { flag, reactive } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import styles from "./DropdownModal.module.css";
import type { ModalProps } from "@/utils/modals";
import type { Color } from "@/utils/color";

export type DropdownOptions = DropdownOption[];

export interface DropdownModalResult {
  options: { value: string; color: Color | null }[];
}

export interface DropdownModalProps extends ModalProps<DropdownModalResult> {
  options?: DropdownOptions;
}

export default function DropdownModal({
  confirm,
  cancel,
  options: initialOptions,
}: DropdownModalProps) {
  const pending = flag(false);
  const options = reactive(
    initialOptions ?? [
      { value: reactive(""), color: reactive(null) },
      { value: reactive(""), color: reactive(null) },
    ],
  );

  async function onSubmit(event: SubmitEvent) {
    const form = event.currentTarget as HTMLFormElement;
    event.preventDefault();

    pending.on();
    try {
      const formData = new FormData(form);
      const optionValues = formData.getAll("option");
      await confirm({
        options: optionValues.map((value) => ({
          value: value as string,
          color: null,
        })),
      });
    } catch (error) {
      handleError(error);
    } finally {
      pending.off();
    }
  }

  function deleteOption(item: DropdownOption) {
    const index = options.value.indexOf(item);
    options.value = options.value.toSpliced(index, 1);
  }

  function addOption() {
    options.value = options.value.concat({
      value: reactive(""),
      color: reactive(null),
    });
  }

  return (
    <form on:submit={onSubmit}>
      <ModalHeader>
        <h2>Dropdown</h2>
      </ModalHeader>

      <ModalBody>
        <fieldset name="options">
          <ol className={styles.options}>
            <Each items={options}>
              {(option) => (
                <DropdownOptionRow option={option} onDelete={deleteOption} />
              )}
            </Each>
          </ol>

          <button type="button" className="secondary" on:click={addOption}>
            <NewIcon aria-hidden="true" />
            Add option
          </button>
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

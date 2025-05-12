import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import { Store } from "@/utils/stores";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";

export type DateTimeModalResult = {
  value: Date;
  time: boolean;
};

interface DateTimeModalProps extends ModalProps<DateTimeModalResult> {
  value?: Date;
  time?: boolean;
}

function getFormattedDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

function getFormattedDateTime(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(
    2,
    "0",
  )}T${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

export default function DateTimeModal({
  value = new Date(),
  time = false,
  cancel,
  confirm,
}: DateTimeModalProps) {
  const date = new Store(value);
  const hasTime = new Store(time);
  const isPending = new Store(false);

  const onChangeDate = (event: Event) => {
    const input = event.target as HTMLInputElement;
    date.value = new Date(input.value);
  };

  const onChangeHasTime = (event: Event) => {
    const input = event.target as HTMLInputElement;
    hasTime.value = input.checked;
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (isPending.value) {
      return;
    }

    try {
      const form = event.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const date = formData.get("date") as string;

      isPending.value = true;
      await confirm({
        value: new Date(date),
        time: hasTime.value,
      });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.value = false;
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <ModalHeader>
        <h2>Date</h2>
      </ModalHeader>

      <ModalBody>
        {hasTime.derive((enabled) =>
          enabled ? (
            <label>
              Date and time
              <input
                type="datetime-local"
                name="date"
                aria-label="Date and time"
                required
                value={getFormattedDateTime(date.value)}
                onchange={onChangeDate}
              />
            </label>
          ) : (
            <label>
              Date
              <input
                type="date"
                name="date"
                aria-label="Date"
                required
                value={getFormattedDate(date.value)}
                onchange={onChangeDate}
              />
            </label>
          ),
        )}

        <label>
          Time
          <input
            name="time"
            type="checkbox"
            role="switch"
            onchange={onChangeHasTime}
            checked={hasTime.value}
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

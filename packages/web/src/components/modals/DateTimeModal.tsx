import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import { reactive, flag } from "carillon";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";

export interface DateTimeModalResult {
  value: Date;
  time: boolean;
}

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
  const date = reactive(value);
  const hasTime = flag(time);
  const pending = flag(false);

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

    if (pending.value) {
      return;
    }

    try {
      const form = event.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const date = formData.get("date") as string;

      pending.on();
      await confirm({
        value: new Date(date),
        time: hasTime.value,
      });
    } catch (error) {
      handleError(error);
    } finally {
      pending.off();
    }
  };

  return (
    <form on:submit={onSubmit}>
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
                on:change={onChangeDate}
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
                on:change={onChangeDate}
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
            checked={hasTime.value}
            on:change={onChangeHasTime}
          />
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

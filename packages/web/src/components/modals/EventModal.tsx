import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import { Store } from "@/utils/stores";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";

export type EventModalResult = {
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
};

interface EventModalProps extends ModalProps<EventModalResult> {
  title?: string;
  start?: string;
  end?: string | null;
  allDay?: boolean;
}

function getFormattedDate(input: string) {
  const date = new Date(input);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

function getFormattedDateTime(input: string) {
  const date = new Date(input);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(
    2,
    "0",
  )}T${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

export default function EventModal({
  cancel,
  confirm,
  ...props
}: EventModalProps) {
  const isPending = new Store(false);
  const allDay = new Store(props.allDay ?? false);

  const changeAllDay = (event: Event) => {
    const input = event.target as HTMLInputElement;
    allDay.value = input.checked;
  };

  const submit = async (event: Event) => {
    const form = event.currentTarget as HTMLFormElement;
    event.preventDefault();

    if (isPending.value) {
      return;
    }

    isPending.value = true;

    const formData = new FormData(form);

    const title = formData.get("title") as string;
    const start = formData.get("start") as string;
    const end = formData.get("end") as string;

    try {
      await confirm({
        title,
        start: new Date(start).toISOString(),
        end: end ? new Date(end).toISOString() : null,
        allDay: allDay.value,
      });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.value = false;
    }
  };

  return (
    <form onSubmit={submit}>
      <ModalHeader>
        <h2>Event</h2>
      </ModalHeader>

      <ModalBody>
        <label>
          Title
          <input
            name="title"
            type="text"
            placeholder="Event title"
            autofocus
            required
            value={props.title ?? ""}
          />
        </label>

        <label>
          All day
          <input
            name="allDay"
            type="checkbox"
            role="switch"
            onchange={changeAllDay}
            checked={props.allDay ?? false}
          />
        </label>

        <label>
          Start
          {allDay.derive((value) =>
            value ? (
              <input
                type="date"
                name="start"
                aria-label="Start date"
                required
                value={props.start ? getFormattedDate(props.start) : ""}
              />
            ) : (
              <input
                type="datetime-local"
                name="start"
                aria-label="Start date and time"
                value={props.start ? getFormattedDateTime(props.start) : ""}
              />
            ),
          )}
        </label>

        <label>
          End
          {allDay.derive((value) =>
            value ? (
              <input
                type="date"
                name="end"
                aria-label="End date"
                value={props.end ? getFormattedDate(props.end) : ""}
              />
            ) : (
              <input
                type="datetime-local"
                name="end"
                aria-label="End date and time"
                value={props.end ? getFormattedDateTime(props.end) : ""}
              />
            ),
          )}
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

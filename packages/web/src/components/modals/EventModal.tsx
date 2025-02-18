import { useCallback, useState, useTransition } from "react";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import type { ModalProps } from "@/utils/modals";
import { classNames } from "@/utils/css";

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
  const [isPending, startTransition] = useTransition();
  const [allDay, setAllDay] = useState(props.allDay ?? false);
  const [title, setTitle] = useState(props.title ?? "");
  const [start, setStart] = useState(props.start ?? "");
  const [end, setEnd] = useState(props.end ?? "");

  const changeTitle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setTitle(event.target.value),
    [],
  );

  const changeStart = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setStart(event.target.value ? `${event.target.value}Z` : ""),
    [],
  );

  const changeEnd = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setEnd(event.target.value ? `${event.target.value}Z` : ""),
    [],
  );

  const changeAllDay = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setAllDay(event.target.checked),
    [],
  );

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isPending) {
        return;
      }

      startTransition(() =>
        confirm({
          title,
          start: new Date(start).toISOString(),
          end: end ? new Date(end).toISOString() : null,
          allDay,
        }),
      );
    },
    [allDay, confirm, end, isPending, start, title],
  );

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
            autoFocus
            required
            value={title}
            onChange={changeTitle}
          />
        </label>

        <label>
          All day
          <input
            name="allDay"
            type="checkbox"
            role="switch"
            onChange={changeAllDay}
            checked={allDay}
          />
        </label>

        <label>
          Start
          {allDay ? (
            <input
              type="date"
              name="start"
              aria-label="Start date"
              required
              value={start ? getFormattedDate(start) : ""}
              onChange={changeStart}
            />
          ) : (
            <input
              type="datetime-local"
              name="start"
              aria-label="Start date and time"
              value={start ? getFormattedDateTime(start) : ""}
              onChange={changeStart}
            />
          )}
        </label>

        <label>
          End
          {allDay ? (
            <input
              type="date"
              name="end"
              aria-label="End date"
              value={end ? getFormattedDate(end) : ""}
              onChange={changeEnd}
            />
          ) : (
            <input
              type="datetime-local"
              name="end"
              aria-label="End date and time"
              value={end ? getFormattedDateTime(end) : ""}
              onChange={changeEnd}
            />
          )}
        </label>
      </ModalBody>

      <ModalFooter>
        <button
          className={classNames("primary", isPending && "pending")}
          type="submit"
        >
          Save
        </button>
        <button className="secondary" type="button" onClick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

import { useCallback, useState } from "react";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import { createTile, updateTile } from "@/utils/edit";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";
import type { ClientEvent } from "@/types/tiles";

interface EventTileModalProps extends ModalProps {
  tileId?: string | null;
  tile?: ClientEvent | null;
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

export default function EditEventTileModal({
  tileId,
  close,
  tile,
}: EventTileModalProps) {
  const [allDay, setAllDay] = useState(tile?.allDay ?? false);
  const [title, setTitle] = useState(tile?.title ?? "");
  const [start, setStart] = useState(tile?.start ?? "");
  const [end, setEnd] = useState(tile?.end ?? "");

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

      try {
        if (tileId) {
          await updateTile(tileId, {
            type: "EVENT",
            event: {
              title,
              start: new Date(start).toISOString(),
              end: end ? new Date(end).toISOString() : null,
              allDay,
            },
          });
        } else {
          await createTile({
            type: "EVENT",
            event: {
              title,
              start: new Date(start).toISOString(),
              end: end ? new Date(end).toISOString() : null,
              allDay,
            },
          });
        }
        close();
      } catch (error) {
        if (error instanceof Error) {
          handleError(error);
        }
      }
    },
    [allDay, close, end, start, tileId, title],
  );

  return (
    <form onSubmit={submit}>
      <ModalHeader>Event</ModalHeader>

      <ModalBody>
        <label>
          Title
          <input
            name="title"
            type="text"
            placeholder="Event title"
            autoFocus
            onChange={changeTitle}
            value={title}
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
        <button className="primary" type="submit">
          Save
        </button>
        <button className="secondary" type="button" onClick={close}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

import NewIcon from "@/icons/new.svg?jsx";
import type { JSX } from "jsx/jsx";

function preventDefault(event: Event) {
  event.preventDefault();
}

export default function InsertButton({ classList, ...props }: JSX.Attributes<"button">) {
  return (
    <button
      type="button"
      classList={{ floating: true, ...classList }}
      aria-label="Insert content"
      aria-haspopup="menu"
      aria-expanded="false"
      data-tooltip="Insert content"
      data-tooltip-position="left"
      on:pointerdown={preventDefault}
      {...props}
    >
      <NewIcon aria-hidden="true" />
    </button>
  );
}

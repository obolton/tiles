import NewIcon from "@/icons/new.svg?jsx";
import type { JSX } from "@/jsx/jsx";

function preventDefault(event: Event) {
  event.preventDefault();
}

export default function InsertButton({ classList, ...props }: JSX.Attributes<"button">) {
  return (
    <button
      type="button"
      classList={{ floating: true, ...classList }}
      aria-haspopup="menu"
      aria-expanded="false"
      on:pointerdown={preventDefault}
      {...props}
    >
      <NewIcon aria-hidden="true" />
    </button>
  );
}

import NewIcon from "@/icons/new.svg?jsx";
import InsertToolbar from "@/components/toolbars/insert/InsertToolbar";
import type { JSX } from "@/jsx/jsx";

function preventDefault(event: Event) {
  event.preventDefault();
}

export interface InsertButtonProps extends JSX.Attributes<HTMLButtonElement> {
  id: string;
  sectionId?: string | null;
  afterId?: string | null;
  orientation?: "horizontal" | "vertical";
}

export default function InsertButton({
  id,
  classList,
  sectionId,
  afterId,
  orientation,
  ...props
}: InsertButtonProps) {
  return (
    <>
      <button
        id={id}
        type="button"
        classList={{ floating: true, ...classList }}
        popovertarget={`${id}-popover`}
        aria-haspopup="menu"
        aria-expanded="false"
        on:pointerdown={preventDefault}
        {...props}
      >
        <NewIcon aria-hidden="true" id="test" />
      </button>

      <InsertToolbar
        id={`${id}-popover`}
        sectionId={sectionId}
        afterId={afterId}
        orientation={orientation}
        anchor={id}
      />
    </>
  );
}

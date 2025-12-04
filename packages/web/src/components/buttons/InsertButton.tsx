import NewIcon from "@/icons/new.svg?jsx";
import InsertMenu from "@/components/toolbars/insert/InsertMenu";
import type { JSX } from "@/jsx/jsx";

function preventDefault(event: Event) {
  event.preventDefault();
}

export interface InsertButtonProps extends JSX.Attributes<"button"> {
  id: string;
  sectionId?: string | null;
  afterId?: string | null;
}

export default function InsertButton({
  id,
  classList,
  sectionId,
  afterId,
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

      <InsertMenu
        id={`${id}-popover`}
        sectionId={sectionId}
        afterId={afterId}
        align="auto"
        anchor={id}
      />
    </>
  );
}

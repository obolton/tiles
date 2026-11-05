import SortIcon from "@/icons/sort.svg?jsx";
import styles from "./SearchToolbar.module.css";
import type { JSX } from "jsx/jsx";
import type { Reactive } from "reactivity";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface SearchToolbarProps<S extends string = string> extends Omit<
  JSX.Attributes<"div">,
  "autofocus"
> {
  id: string;
  placeholder?: string;
  /** `"pointer"` only focuses on devices with a fine pointer, so phones don't open the keyboard on load. */
  autofocus?: boolean | "pointer";
  query: Reactive<string>;
  sortOptions?: JSX.Node;
  sort?: Reactive<S>;
}

function focusWithPointer(input: HTMLInputElement) {
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    input.focus({ preventScroll: true });
  }
}

export default function SearchToolbar<S extends string = string>({
  id,
  placeholder,
  autofocus = true,
  query,
  sortOptions,
  sort,
  classList,
  ...props
}: SearchToolbarProps<S>) {
  function onInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    query.value = input.value.trim();
  }

  function onSortChange(event: Event) {
    if (sort) {
      sort.value = (event.currentTarget as ListSelect).value as S;
    }
  }

  return (
    <div
      classList={{ [styles.toolbar]: true, ...classList }}
      role="search"
      aria-label="Search"
      {...props}
    >
      <input
        id={id}
        type="search"
        className={styles.search}
        autofocus={autofocus === true}
        ref={autofocus === "pointer" && !import.meta.env.SSR ? focusWithPointer : undefined}
        placeholder={placeholder}
        on:input={onInput}
      />

      {sortOptions && sort && (
        <list-select
          aria-label="Sort by"
          orientation="vertical"
          data-tooltip="Sort by"
          showvalue
          value={sort}
          on:change={onSortChange}
        >
          <SortIcon slot="default-icon" aria-hidden="true" />
          {sortOptions}
        </list-select>
      )}
    </div>
  );
}

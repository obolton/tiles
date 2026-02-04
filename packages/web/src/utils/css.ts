import type { ClassList } from "@/jsx/html-attributes";

export function classNames(...args: (string | null | undefined | false)[]) {
  return args
    .filter(
      (className) => typeof className === "string" && className.length > 0,
    )
    .join(" ");
}

/**
 * Merges multiple class lists objects into one.
 *
 * @example
 * classList(
 *   { [styles.button]: true, primary: true },
 *   props.classList,
 *   { pending: isPending }
 * )
 */
export function classList(
  ...sources: (ClassList | undefined | null | false)[]
): ClassList {
  const result: ClassList = {};
  for (const source of sources) {
    if (source) {
      Object.assign(result, source);
    }
  }
  return result;
}

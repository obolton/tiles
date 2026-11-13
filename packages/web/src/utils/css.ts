export function classNames(...args: (string | null | undefined | false)[]) {
  return args
    .filter((className) => typeof className === "string" && className.length > 0)
    .join(" ");
}

export function classNames(...args: (string | null | undefined | false)[]) {
  return args
    .filter(
      (className) => typeof className === "string" && className.length > 0,
    )
    .join(" ");
}

export function transformCSSProperty(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function serializeStyles(styles: object) {
  const rules: string[] = [];
  for (const [name, value] of Object.entries(styles)) {
    if (!(typeof value === "string" || typeof value === "number")) {
      continue;
    }
    rules.push(transformCSSProperty(name) + ":" + value);
  }
  return rules.join(";");
}

export function pick(object: object, keys: string[]) {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => keys.includes(key)),
  );
}

export function omit(object: object, keys: string[]) {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => !keys.includes(key)),
  );
}

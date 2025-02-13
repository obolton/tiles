export function cleanUserInput(input: string) {
  return input.trim();
}

export function cleanSingleLineInput(input: string) {
  return input.replace(/[\r\n]/g, "").trim();
}

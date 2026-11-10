/**
 * Saves text as a file through a temporary download link. Synchronous, so a call from a click
 * handler keeps the user activation the download needs.
 */
export function downloadFile(contents: string, filename: string, type: string): void {
  const anchor = document.createElement("a");
  anchor.href = `data:${type},${encodeURIComponent(contents)}`;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

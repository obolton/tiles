/** How long the object URL outlives the click; Safari needs it past the event. */
const REVOKE_DELAY = 1000;

/**
 * Saves content as a file through a temporary download link. Synchronous, so a call from a
 * click handler keeps the user activation the download needs.
 */
export function downloadFile(contents: BlobPart, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY);
}

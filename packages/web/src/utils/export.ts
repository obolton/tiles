import { pageToMarkdown } from "doc/markdown/page";
import { downloadFile } from "@/utils/download";
import { handleError } from "@/utils/errors";
import { getImageUrl } from "@/utils/images";
import { getPublicPageUrl } from "@/utils/pages";
import { showToast } from "@/utils/toasts";
import type Page from "@/models/Page";

const MARKDOWN_TYPE = "text/markdown;charset=utf-8";
const MAX_FILENAME_LENGTH = 100;
const UNSAFE_FILENAME_CHARACTERS = /[\\/:*?"<>|\p{Cc}]/gu;

/** The page title as a Markdown file name, without the characters file systems reject. */
export function toMarkdownFilename(title: string): string {
  const name = title
    .replace(UNSAFE_FILENAME_CHARACTERS, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "")
    .slice(0, MAX_FILENAME_LENGTH)
    .trim();
  return `${name || "Untitled"}.md`;
}

/** Downloads the page as a Markdown file named after its title. */
export function exportPageAsMarkdown(page: Page): void {
  try {
    const markdown = pageToMarkdown(page.doc, {
      title: page.title.value,
      type: page.type,
      imageUrl: getImageUrl,
      pageUrl: getPublicPageUrl,
    });
    const filename = toMarkdownFilename(page.title.value);
    downloadFile(markdown, filename, MARKDOWN_TYPE);
    showToast(`Downloaded ${filename}`, "success");
  } catch (error) {
    handleError(error);
  }
}

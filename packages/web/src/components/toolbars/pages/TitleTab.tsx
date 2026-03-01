import { handleError } from "@/utils/errors";
import styles from "./TitleTab.module.css";
import type Page from "@/models/Page";

export interface TitleTabProps {
  page: Page;
}

export default function TitleTab({ page }: TitleTabProps) {
  function onBlur(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    page.setTitle(input.value).catch(handleError);
  }

  return (
    <toolbar-tab name="title" label="Title">
      <input
        className={styles.title}
        type="text"
        placeholder="Page title"
        value={page.title}
        on:blur={onBlur}
      />
    </toolbar-tab>
  );
}

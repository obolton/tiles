import If from "@/jsx/if";
import { handleError } from "@/utils/errors";
import styles from "./PageTitle.module.css";
import type Page from "@/models/Page";
import type { Reactive } from "@/utils/reactivity";

export interface PageTitleProps {
  page: Page;
  isEditable: Reactive<boolean>;
}

export default function PageTitle({ page, isEditable }: PageTitleProps) {
  function onBlur(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    page.setTitle(input.value).catch(handleError);
  }

  return (
    <h1>
      <If condition={isEditable}>
        <input
          className={styles.input}
          type="text"
          placeholder="Page title"
          value={page.title}
          on:blur={onBlur}
        />
      </If>

      <If condition={isEditable.derive((v) => !v)}>{page.title}</If>
    </h1>
  );
}

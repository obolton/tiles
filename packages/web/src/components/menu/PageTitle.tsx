import { Switch, Case, Default } from "@/jsx/switch";
import VersionIndicator from "@/components/versions/VersionIndicator";
import { handleError } from "@/utils/errors";
import styles from "./PageTitle.module.css";
import type Page from "@/models/Page";
import type { VersionEntry } from "@/components/versions/VersionHistory";
import type { Reactive } from "@/utils/reactivity";

export interface PageTitleProps {
  page: Page;
  isEditable: Reactive<boolean>;
  version?: VersionEntry;
}

export default function PageTitle({ page, isEditable, version }: PageTitleProps) {
  function onBlur(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    page.setTitle(input.value).catch(handleError);
  }

  return (
    <>
      <h1>
        <Switch value={isEditable}>
          <Case value={true}>
            <input
              className={styles.input}
              type="text"
              placeholder="Page title"
              value={page.title}
              on:blur={onBlur}
            />
          </Case>
          <Default>{page.title}</Default>
        </Switch>
      </h1>

      {version ? <VersionIndicator version={version} /> : null}
    </>
  );
}

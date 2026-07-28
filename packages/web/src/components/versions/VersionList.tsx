import VersionListItem from "./VersionListItem";
import styles from "./VersionList.module.css";
import type VersionHistory from "./VersionHistory";

export interface VersionListProps {
  state: VersionHistory;
}

export default function VersionList({ state }: VersionListProps) {
  const { versions, isLoading, selectedId } = state;

  function onSelectCurrent() {
    if (state.previewVersion) {
      state.exit();
    }
  }

  return (
    <infinite-scroll
      className={styles.scroll}
      aria-busy={isLoading.derive((loading) => (loading ? "true" : undefined))}
      on:loadmore={() => state.loadMore()}
    >
      <ul className={styles.list}>
        <VersionListItem
          selected={selectedId.derive((id) => id === null)}
          onSelect={onSelectCurrent}
        />
        {versions.derive((versions) =>
          versions.map((version) => (
            <VersionListItem
              version={version}
              selected={selectedId.derive((id) => id === version.id)}
              onSelect={() => state.select(version.id)}
            />
          )),
        )}
      </ul>
    </infinite-scroll>
  );
}

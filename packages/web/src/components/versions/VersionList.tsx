import VersionListItem from "./VersionListItem";
import Placeholder from "@/components/placeholder/Placeholder";
import { combine } from "@/utils/reactivity";
import styles from "./VersionList.module.css";
import type VersionHistory from "./VersionHistory";

export interface VersionListProps {
  state: VersionHistory;
}

export default function VersionList({ state }: VersionListProps) {
  const { versions, isLoading, selectedId } = state;

  return (
    <infinite-scroll
      className={styles.scroll}
      aria-busy={isLoading.derive((loading) => (loading ? "true" : undefined))}
      on:loadmore={() => state.loadMore()}
    >
      {combine({ versions, isLoading }, ({ versions, isLoading }) => {
        if (versions.length === 0) {
          return isLoading ? null : <Placeholder>No versions yet</Placeholder>;
        }
        return (
          <ul className={styles.list}>
            {versions.map((version) => (
              <VersionListItem
                version={version}
                selected={selectedId.derive((id) => id === version.id)}
                onSelect={() => state.select(selectedId.value === version.id ? null : version.id)}
              />
            ))}
          </ul>
        );
      })}
    </infinite-scroll>
  );
}

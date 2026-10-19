import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Folders from "@/components/folders/Folders";
import Placeholder from "@/components/placeholder/Placeholder";
import PagesGrid, {
  PageSortOptions,
  parsePageSort,
  type PageSort,
  type PagesSearchResults,
} from "@/components/grid/PagesGrid";
import SearchToolbar from "@/components/search/SearchToolbar";
import { handleError } from "@/utils/errors";
import { persistent } from "@/utils/persistent";
import { reactive } from "reactivity";
import type { FoldersProps } from "@/components/folders/Folders";
import type { JSX } from "jsx/jsx";
import type { Reactive } from "reactivity";
import type { User } from "@/utils/sessions";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface LibrarySearchOptions extends Partial<ReturnType<typeof parsePageSort>> {
  query: string | undefined;
  cursor: string | undefined;
}

export interface LibraryPageState {
  pages: Reactive<PagesSearchResults["pages"]>;
  cursor: Reactive<string | null>;
}

export interface LibraryPageProps {
  workspace: { id: string };
  folders: FoldersProps["folders"];
  selectedFolderId?: FoldersProps["selectedId"];
  pages: PagesSearchResults;
  user: User;
  placeholder: string;
  emptyMessage: string;
  search: (options: LibrarySearchOptions) => Promise<PagesSearchResults>;
  sortable?: boolean;
  draggable?: boolean;
  link?: boolean;
  move?: boolean;
  trash?: boolean;
  restore?: boolean;
  bookmark?: boolean;
  renderActions?: (state: LibraryPageState) => JSX.Node;
  renderBefore?: (state: LibraryPageState) => JSX.Node;
}

export default function LibraryPage({
  workspace,
  folders,
  selectedFolderId,
  pages: initialPages,
  user,
  placeholder,
  emptyMessage,
  search,
  sortable = true,
  draggable,
  link,
  move,
  trash,
  restore,
  bookmark,
  renderActions,
  renderBefore,
}: LibraryPageProps) {
  const query = reactive("");
  const sort = sortable ? persistent<PageSort>("library:sort", "updatedAt:desc") : undefined;
  const pages = reactive(initialPages.pages);
  const cursor = reactive<string | null>(initialPages.nextCursor);
  const state: LibraryPageState = { pages, cursor };

  return (
    <PageLayout
      workspaceId={workspace.id}
      user={user}
      center={
        <SearchToolbar
          id="search-pages"
          placeholder={placeholder}
          query={query}
          sortOptions={sort && <PageSortOptions />}
          sort={sort}
        />
      }
      actions={renderActions?.(state)}
    >
      <SidebarLayout
        sidebar={
          <Folders workspaceId={workspace.id} selectedId={selectedFolderId} folders={folders} />
        }
      >
        {renderBefore?.(state)}

        <PagesGrid
          workspaceId={workspace.id}
          query={query}
          pages={pages}
          cursor={cursor}
          search={(query, searchCursor) =>
            search({
              query: query || undefined,
              cursor: searchCursor ?? undefined,
              ...(sort && parsePageSort(sort.value)),
            })
          }
          renderPlaceholder={(query) => (
            <Placeholder>{query ? "There are no results." : emptyMessage}</Placeholder>
          )}
          sort={sort}
          draggable={draggable}
          link={link}
          move={move}
          trash={trash}
          restore={restore}
          bookmark={bookmark}
        />
      </SidebarLayout>
    </PageLayout>
  );
}

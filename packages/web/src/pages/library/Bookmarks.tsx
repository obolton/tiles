import client from "@/api/client";
import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import Placeholder from "@/components/placeholder/Placeholder";
import PagesGrid from "@/components/grid/PagesGrid";
import SearchToolbar from "@/components/search/SearchToolbar";
import { handleError } from "@/utils/errors";
import { reactive } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";
import type { User } from "@/utils/sessions";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface BookmarksProps {
  workspace: AppRouterOutputs["workspaces"]["get"];
  folders: AppRouterOutputs["folders"]["list"];
  pages: AppRouterOutputs["bookmarks"]["list"];
  user: User;
}

function renderPlaceholder(query: string) {
  return (
    <Placeholder>
      {query ? "There are no results." : "You don’t have any bookmarks."}
    </Placeholder>
  );
}

export default function Bookmarks({
  workspace,
  folders,
  pages: initialPages,
  user,
}: BookmarksProps) {
  const query = reactive("");
  const pages = reactive(initialPages.pages);
  const cursor = reactive<string | null>(initialPages.nextCursor);

  return (
    <PageLayout
      workspaceId={workspace.id}
      user={user}
      center={
        <SearchToolbar
          id="search-pages"
          placeholder="Search bookmarks"
          query={query}
        />
      }
    >
      <SidebarLayout
        sidebar={
          <Sidebar
            workspace={workspace}
            folders={folders}
            selectedFolderId="BOOKMARKS"
          />
        }
      >
        <PagesGrid
          workspaceId={workspace.id}
          query={query}
          pages={pages}
          cursor={cursor}
          search={(query, searchCursor) =>
            client.bookmarks.list.query({
              query: query || undefined,
              cursor: searchCursor ?? undefined,
            })
          }
          renderPlaceholder={renderPlaceholder}
          draggable
          bookmark
        />
      </SidebarLayout>
    </PageLayout>
  );
}

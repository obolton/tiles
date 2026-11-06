import Header from "../Header";
import SearchToolbar from "@/components/search/SearchToolbar";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import { PageSortOptions, type PageSort } from "@/components/grid/PagesGrid";
import { reactive } from "reactivity";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import PresentIcon from "@/icons/present.svg?jsx";
import MenuIcon from "@/icons/menu.svg?jsx";
import UndoIcon from "@/icons/undo.svg?jsx";
import RedoIcon from "@/icons/redo.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import MoreIcon from "@/icons/more.svg?jsx";
import type { Meta, Story } from "@/test/storybook";
import type { User } from "@/utils/sessions";

const meta = {
  title: "Header",
} satisfies Meta;
export default meta;

const USER: User = {
  id: "user-1",
  name: "Jane Smith",
  username: "jane",
  email: "jane@example.com",
  imageUrl: null,
  imageKey: null,
  workspaces: [
    { id: "ws-1", name: "Personal" },
    { id: "ws-2", name: "Acme Corp" },
  ],
};

const WORKSPACE_ID = "ws-1";

function LibrarySearch() {
  return (
    <SearchToolbar
      id="search-pages"
      placeholder="Search pages"
      autofocus={false}
      query={reactive("")}
      sortOptions={<PageSortOptions />}
      sort={reactive<PageSort>("updatedAt:desc")}
    />
  );
}

export const LibraryPage: Story = {
  render: () => (
    <Header user={USER} workspaceId={WORKSPACE_ID} center={<LibrarySearch />} stacked />
  ),
};

export const LibraryPagePhone: Story = {
  render: () => (
    <Header
      user={{ ...USER, workspaces: [{ id: "ws-1", name: "A workspace with a long name" }] }}
      workspaceId={WORKSPACE_ID}
      center={<LibrarySearch />}
      actions={
        <button type="button" className="secondary">
          Empty trash
        </button>
      }
      stacked
    />
  ),
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const SettingsPage: Story = {
  render: () => <Header user={USER} workspaceId={WORKSPACE_ID} center={<h1>Settings</h1>} />,
};

/** The secondary actions as they appear below the compact breakpoint */
function CompactPageActions() {
  return (
    <ToolbarGroup label="Page actions">
      <ToolbarButton label="More actions" aria-haspopup="menu" aria-expanded="false">
        <MoreIcon aria-hidden="true" />
      </ToolbarButton>
    </ToolbarGroup>
  );
}

export const EditorViewMode: Story = {
  render: () => (
    <Header
      user={USER}
      workspaceId={WORKSPACE_ID}
      center={<h1>My Document</h1>}
      stacked
      actions={
        <>
          <ToolbarGroup label="Editing">
            <button type="button" className="primary">
              Edit
            </button>
          </ToolbarGroup>

          <ToolbarGroup label="Page actions">
            <ToolbarButton label="Not bookmarked">
              <BookmarkIcon aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Present">
              <PresentIcon aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Table of contents">
              <MenuIcon aria-hidden="true" />
            </ToolbarButton>
          </ToolbarGroup>
        </>
      }
    />
  ),
};

export const EditorEditMode: Story = {
  render: () => (
    <Header
      user={USER}
      workspaceId={WORKSPACE_ID}
      center={<h1>My Document</h1>}
      stacked
      actions={
        <>
          <ToolbarGroup label="Editing">
            <button type="button" className="primary" aria-pressed="true">
              Done
            </button>
            <ToolbarButton label="Undo">
              <UndoIcon aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Redo">
              <RedoIcon aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Collaboration">
              <PeopleIcon aria-hidden="true" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup label="Page actions">
            <ToolbarButton label="Not bookmarked">
              <BookmarkIcon aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Present">
              <PresentIcon aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Table of contents">
              <MenuIcon aria-hidden="true" />
            </ToolbarButton>
          </ToolbarGroup>
        </>
      }
    />
  ),
};

export const EditorViewModePhone: Story = {
  render: () => (
    <Header
      user={{ ...USER, workspaces: [{ id: "ws-1", name: "A workspace with a long name" }] }}
      workspaceId={WORKSPACE_ID}
      center={<h1>A document title that is long enough to need truncating</h1>}
      stacked
      actions={
        <>
          <ToolbarGroup label="Editing">
            <button type="button" className="primary">
              Edit
            </button>
          </ToolbarGroup>
          <CompactPageActions />
        </>
      }
    />
  ),
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const EditorEditModePhone: Story = {
  render: () => (
    <Header
      user={USER}
      workspaceId={WORKSPACE_ID}
      center={<h1>My Document</h1>}
      stacked
      actions={
        <>
          <ToolbarGroup label="Editing">
            <button type="button" className="primary" aria-pressed="true">
              Done
            </button>
            <ToolbarButton label="Undo">
              <UndoIcon aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Redo">
              <RedoIcon aria-hidden="true" />
            </ToolbarButton>
          </ToolbarGroup>
          <CompactPageActions />
        </>
      }
    />
  ),
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const SingleWorkspace: Story = {
  render: () => (
    <Header
      user={{
        ...USER,
        workspaces: [{ id: "ws-1", name: "Personal" }],
      }}
      workspaceId={WORKSPACE_ID}
    />
  ),
};

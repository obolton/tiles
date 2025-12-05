import Search from "@/components/search/Search";
import UserRow from "@/components/collaboration/UserRow";
import Placeholder from "@/components/placeholder/Placeholder";
import client from "@/api/client";
import { reactive, flag } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import styles from "./WorkspaceMembers.module.css";
import type { AppRouterOutputs } from "@/api/client";
import type { User } from "@/types/collaboration";

export interface WorkspaceMembersProps {
  workspaceId: string;
  members: AppRouterOutputs["workspaces"]["listUsers"];
}

export default function WorkspaceMembers({
  workspaceId,
  members: initialMembers,
}: WorkspaceMembersProps) {
  const members = reactive(initialMembers.users);
  const hasMore = flag(initialMembers.hasMore);

  const onSearch = async (query: string, offset: number = 0) => {
    try {
      if (!query && offset === 0) {
        members.value = initialMembers.users;
        hasMore.value = initialMembers.hasMore;
        return;
      }

      const results = await client.workspaces.listUsers.query({
        workspaceId,
        query: query || undefined,
        offset,
      });
      if (offset === 0) {
        members.value = results.users;
      } else {
        members.value = [...members.value, ...results.users];
      }
      hasMore.value = results.hasMore;
    } catch (error) {
      handleError(error);
    }
  };

  const onRemove = async (user: User) => {
    try {
      await client.workspaces.remove.mutate({ workspaceId, userId: user.id });
      members.value = members.value.filter((member) => member !== user);
      showToast(`${user.name} was removed from the workspace.`, "success");
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <section>
      <h3>Members</h3>

      <Search
        itemsClassName={styles.members}
        id="search-members"
        search={onSearch}
        results={members}
        hasMore={hasMore}
        placeholder="Search members"
        render={(member) => (
          <UserRow
            user={member}
            description={member.email}
            showRemoveButton={initialMembers.users.length > 1}
            onRemove={onRemove}
          />
        )}
        renderPlaceholder={() => (
          <Placeholder>There are no results</Placeholder>
        )}
      />
    </section>
  );
}

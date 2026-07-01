import Search from "@/components/search/Search";
import SearchToolbar from "@/components/search/SearchToolbar";
import MemberCard from "./MemberCard";
import Placeholder from "@/components/placeholder/Placeholder";
import client from "@/api/client";
import { user as currentUser } from "@/utils/sessions";
import { reactive } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import styles from "./WorkspaceMembers.module.css";
import type { AppRouterOutputs } from "@/api/client";
import type { ReactiveValue } from "@/utils/reactivity";
import type { WorkspaceMember } from "./MemberCard";

export interface WorkspaceMembersProps {
  workspaceId: string;
  members: AppRouterOutputs["workspaces"]["listUsers"];
  isAdmin: ReactiveValue<boolean>;
}

export default function WorkspaceMembers({
  workspaceId,
  members: initialMembers,
  isAdmin,
}: WorkspaceMembersProps) {
  const query = reactive("");
  const members = reactive(initialMembers.users);
  const nextCursor = reactive(initialMembers.nextCursor);

  const onSearch = async (query: string, cursor: string | null) => {
    try {
      if (!query && !cursor) {
        members.value = initialMembers.users;
        nextCursor.value = initialMembers.nextCursor;
        return;
      }

      const results = await client.workspaces.listUsers.query({
        workspaceId,
        query: query || undefined,
        cursor: cursor ?? undefined,
      });
      if (!cursor) {
        members.value = results.users;
      } else {
        members.value = [...members.value, ...results.users];
      }
      nextCursor.value = results.nextCursor;
    } catch (error) {
      handleError(error);
    }
  };

  const onRemove = async (member: WorkspaceMember) => {
    const isSelf = member.id === currentUser.value?.id;
    const previousMembers = members.value;
    members.value = members.value.filter((m) => m !== member);

    try {
      if (isSelf) {
        await client.workspaces.leave.mutate({ workspaceId });
        window.location.href = "/";
      } else {
        await client.workspaces.remove.mutate({
          workspaceId,
          userId: member.id,
        });
      }
    } catch (error) {
      members.value = previousMembers;
      handleError(error);
    }
  };

  const onChangeRole = async (member: WorkspaceMember, role: WorkspaceMember["role"]) => {
    const previousRole = member.role;
    const isSelf = member.id === currentUser.value?.id;
    members.value = members.value.map((m) => (m === member ? { ...m, role } : m));
    if (isSelf) {
      isAdmin.value = role === "ADMIN";
    }
    try {
      await client.workspaces.updateRole.mutate({
        workspaceId,
        userId: member.id,
        role,
      });
    } catch (error) {
      members.value = members.value.map((m) =>
        m.id === member.id ? { ...m, role: previousRole } : m,
      );
      if (isSelf) {
        isAdmin.value = previousRole === "ADMIN";
      }
      handleError(error);
    }
  };

  const onLeave = async (event: SubmitEvent) => {
    const form = event.currentTarget as HTMLFormElement;
    event.preventDefault();
    form.dataset.pending = "true";
    try {
      await client.workspaces.leave.mutate({ workspaceId });
      window.location.href = "/";
    } catch (error) {
      delete form.dataset.pending;
      handleError(error);
    }
  };

  return (
    <>
      <SearchToolbar
        id="search-members"
        classList={{ [styles.toolbar]: true }}
        placeholder="Search members"
        query={query}
      />

      <Search
        itemsClassName={styles.members}
        search={onSearch}
        results={members}
        nextCursor={nextCursor}
        query={query}
        render={(member) => (
          <MemberCard
            member={member}
            editable={isAdmin}
            isSelf={member.id === currentUser.value?.id}
            onChangeRole={(role) => onChangeRole(member, role)}
            onRemove={() => onRemove(member)}
          />
        )}
        renderPlaceholder={() => <Placeholder>There are no results</Placeholder>}
      />

      <form className={styles.leave} on:submit={onLeave}>
        <button className="secondary destructive" type="submit">
          Leave workspace
        </button>
      </form>
    </>
  );
}

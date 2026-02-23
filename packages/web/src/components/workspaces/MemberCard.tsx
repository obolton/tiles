import ProfileImage from "@/components/profile-image/ProfileImage";
import ListGroup from "@/components/lists/ListGroup";
import ListOption from "@/components/lists/ListOption";
import styles from "./MemberCard.module.css";
import type { Reactive } from "@/utils/reactivity";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { AppRouterOutputs } from "@/api/client";

export type WorkspaceMember =
  AppRouterOutputs["workspaces"]["listUsers"]["users"][number];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MEMBER: "Member",
};

export interface MemberCardProps {
  member: WorkspaceMember;
  editable: Reactive<boolean>;
  isSelf: boolean;
  onChangeRole?: (role: WorkspaceMember["role"]) => void;
  onRemove?: () => void;
}

export default function MemberCard({
  member,
  editable,
  isSelf,
  onChangeRole,
  onRemove,
}: MemberCardProps) {
  function onChange(event: Event) {
    const select = event.currentTarget as ListSelect;
    if (select.value === "REMOVE") {
      onRemove?.();
      select.value = member.role;
    } else if (select.value) {
      onChangeRole?.(select.value as WorkspaceMember["role"]);
    }
  }

  return (
    <article className={styles.card}>
      <ProfileImage
        imageUrl={member.imageUrl}
        name={member.name}
        size="medium"
      />

      <div className={styles.text}>
        <span className={styles.name}>{member.name}</span>
        <span className={styles.email}>{member.email}</span>
      </div>

      {editable.derive((edit) =>
        edit ? (
          <list-select
            className={styles.role}
            orientation="vertical"
            showvalue
            value={member.role}
            on:change={onChange}
          >
            <ListGroup>
              <ListOption value="ADMIN" label="Admin">
                Admin
              </ListOption>
              <ListOption value="MEMBER" label="Member">
                Member
              </ListOption>
            </ListGroup>
            <ListGroup>
              <ListOption
                value="REMOVE"
                label="Remove"
                classList={{ destructive: true }}
              >
                {isSelf ? "Leave workspace" : "Remove from workspace"}
              </ListOption>
            </ListGroup>
          </list-select>
        ) : (
          <span className={styles.role}>
            {ROLE_LABELS[member.role] ?? member.role}
          </span>
        ),
      )}
    </article>
  );
}

import EditingToolbar from "@/components/menu/EditingToolbar";
import ProfilePageHeader from "@/components/header/ProfilePageHeader";
import PageContents from "@/components/pages/PageContents";
import ModalLauncher from "@/components/modals/ModalLauncher";
import Editor from "@/editor/Editor";
import { ReactiveValue } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor");
}

interface EditableProfilePageProps {
  user: NonNullable<AppRouterOutputs["pages"]["getProfilePage"]>;
}

export default function EditableProfilePage({
  user,
}: EditableProfilePageProps) {
  const editor = new Editor(user.profilePage);
  const { isEditable, subtitle, layout, focusedTile } = editor;

  return (
    <>
      <ProfilePageHeader
        editor={editor}
        name={user.name}
        imageUrl={user.imageUrl}
        subtitle={subtitle}
      />

      <main>
        <PageContents editor={editor} isEditable={isEditable} layout={layout} />
      </main>

      {focusedTile.derive((id) =>
        id ? null : (
          <EditingToolbar
            editor={editor}
            isEditable={isEditable}
            isPublished={new ReactiveValue(true)}
            allowDelete={false}
            allowPublish={false}
          />
        ),
      )}

      <ModalLauncher />
    </>
  );
}

import EditingToolbar from "@/components/menu/EditingToolbar";
import ProfilePageHeader from "@/components/header/ProfilePageHeader";
import Grid from "@/components/grid/Grid";
import type { AppRouterOutputs } from "@/api/client";

interface EditableProfilePageProps {
  user: NonNullable<AppRouterOutputs["pages"]["getProfilePage"]>;
}

export default function EditableProfilePage({
  user,
}: EditableProfilePageProps) {
  return (
    <>
      <EditingToolbar isPublished allowDelete={false} allowPublish={false} />

      <ProfilePageHeader
        name={user.name}
        imageUrl={user.imageUrl}
        subtitle={user.profilePage.subtitle}
      />

      <Grid tiles={user.profilePage.tiles} />
    </>
  );
}

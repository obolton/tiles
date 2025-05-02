import PageLayout from "@/layouts/PageLayout";
import EditableProfilePage from "@/components/pages/EditableProfilePage";
import type { AppRouterOutputs } from "@/api/client";

type ProfilePageData = NonNullable<AppRouterOutputs["pages"]["getProfilePage"]>;

export interface ProfilePageProps {
  user: ProfilePageData;
}

export default function ProfilePage({ user }: ProfilePageProps) {
  return (
    <PageLayout showTableOfContents>
      <EditableProfilePage user={user} />
    </PageLayout>
  );
}

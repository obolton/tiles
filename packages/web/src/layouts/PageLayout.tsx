import Navigation from "@/components/menu/Navigation";
import SignIn from "@/components/menu/SignIn";
import SpeculationRules from "@/components/resources/SpeculationRules";
import "@/styles";
import type { JSX } from "@/jsx/jsx";

export interface PageLayoutProps {
  workspaceId?: string;
  showBookmark?: boolean;
  showTableOfContents?: boolean;
  children: JSX.Node;
}

export default function PageLayout({
  workspaceId,
  showBookmark,
  showTableOfContents,
  children,
}: PageLayoutProps) {
  return (
    <>
      {workspaceId ? (
        <Navigation
          workspaceId={workspaceId}
          showBookmark={showBookmark}
          showTableOfContents={showTableOfContents}
        />
      ) : null}

      <SignIn />

      {children}

      <toast-container />

      <SpeculationRules />
    </>
  );
}

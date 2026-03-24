import Header from "@/components/menu/Header";
import SignIn from "@/components/menu/SignIn";
import SpeculationRules from "@/components/resources/SpeculationRules";
import { user } from "@/utils/sessions";
import "@/styles";
import type { JSX } from "@/jsx/jsx";

export interface PageLayoutProps {
  workspaceId?: string;
  center?: JSX.Node;
  actions?: JSX.Node;
  children: JSX.Node;
}

export default function PageLayout({
  workspaceId,
  center,
  actions,
  children,
}: PageLayoutProps) {
  return (
    <>
      {workspaceId
        ? user.derive((value) =>
            value ? (
              <Header
                user={value}
                workspaceId={workspaceId}
                center={center}
                actions={actions}
              />
            ) : null,
          )
        : null}

      <SignIn />

      {children}

      <toast-container />

      <SpeculationRules />
    </>
  );
}

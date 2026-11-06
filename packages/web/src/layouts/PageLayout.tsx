import Header from "@/components/menu/Header";
import SignIn from "@/components/menu/SignIn";
import SpeculationRules from "@/components/resources/SpeculationRules";
import { user, type User } from "@/utils/sessions";
import "@/styles";
import type { JSX } from "jsx/jsx";

export interface PageLayoutProps {
  workspaceId?: string;
  user?: User;
  center?: JSX.Node;
  actions?: JSX.Node;
  stacked?: boolean;
  children: JSX.Node;
}

export default function PageLayout(props: PageLayoutProps) {
  const { workspaceId, center, actions, stacked, children } = props;

  return (
    <>
      {workspaceId
        ? user.derive((value) => {
            const userData = value ?? props.user;
            return userData ? (
              <Header
                user={userData}
                workspaceId={workspaceId}
                center={center}
                actions={actions}
                stacked={stacked}
              />
            ) : null;
          })
        : null}

      <SignIn />

      {children}

      <toast-container />

      <SpeculationRules />
    </>
  );
}

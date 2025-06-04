import Navigation from "@/components/menu/Navigation";
import SignIn from "@/components/menu/SignIn";
import ModalLauncher from "@/components/modals/ModalLauncher";
import SpeculationRules from "@/components/resources/SpeculationRules";
import "@/styles/global.css";
import "@/styles/editing.css";
import "@/styles/toolbars.css";
import "@/styles/buttons.css";
import "@/styles/forms.css";
import "@/styles/drag.css";
import "@/styles/resize.css";
import "@/styles/lightbox.css";
import "@/styles/popovers.css";
import "@/styles/navigation.css";
import "@/styles/toasts.css";
import "@/styles/images.css";
import "@/styles/animation.css";
import "@/styles/tabs.css";
import "@/styles/carousels.css";
import "@/styles/tooltips.css";
import "@/styles/richText.css";
import "@/styles/tables.css";
import "@/styles/themes.css";
import type { JSX } from "@/jsx/jsx";

export interface PageLayoutProps {
  showBookmark?: boolean;
  showTableOfContents?: boolean;
  showShare?: boolean;
  children: JSX.Node;
}

export default function PageLayout({
  showBookmark,
  showTableOfContents,
  showShare,
  children,
}: PageLayoutProps) {
  return (
    <>
      <Navigation
        showBookmark={showBookmark}
        showTableOfContents={showTableOfContents}
        showShare={showShare}
      />
      <SignIn />

      {children}

      <toast-container />

      <ModalLauncher />

      <SpeculationRules />
    </>
  );
}

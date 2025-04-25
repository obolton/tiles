import Navigation from "@/components/menu/Navigation";
import SignIn from "@/components/menu/SignIn";
import SpeculationRules from "@/components/resources/SpeculationRules";
import "@/styles/global.css";
import "@/styles/editing.css";
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
import type { JSX } from "@/jsx/jsx";

export interface PageLayoutProps {
  showTableOfContents?: boolean;
  children: JSX.Node;
}

export default function PageLayout({
  showTableOfContents = false,
  children,
}: PageLayoutProps) {
  return (
    <>
      <Navigation showTableOfContents={showTableOfContents} />
      <SignIn />

      {children}

      <toast-container />

      <SpeculationRules />
    </>
  );
}

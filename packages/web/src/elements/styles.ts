import animationCss from "@/styles/animation.css?inline";

const animationStyles = new CSSStyleSheet();
animationStyles.replaceSync(animationCss);

/** Adopts stylesheets into a shadow root, along with the styles shared by all elements. */
export function adoptStyles(root: ShadowRoot, ...stylesheets: CSSStyleSheet[]) {
  root.adoptedStyleSheets = [...stylesheets, animationStyles];
}

import reducedMotionCss from "@/styles/reducedMotion.css?inline";

const reducedMotionStyles = new CSSStyleSheet();
reducedMotionStyles.replaceSync(reducedMotionCss);

/** Adopts stylesheets into a shadow root, along with the styles shared by all elements. */
export function adoptStyles(root: ShadowRoot, ...stylesheets: CSSStyleSheet[]) {
  root.adoptedStyleSheets = [...stylesheets, reducedMotionStyles];
}

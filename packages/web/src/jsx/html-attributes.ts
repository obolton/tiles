/**
 * HTML attribute types for JSX elements.
 *
 * For DOM property access, use the $-prefixed syntax (e.g., $tabIndex).
 */

import type { Reactive } from "@/utils/reactivity";

// Style types

export type ClassList = {
  [className: string]:
    | boolean
    | null
    | undefined
    | Reactive<boolean | null | undefined>;
};

export type StyleValue = string | number | null | undefined;

export type CustomCSSProperty = `--${string}`;

export type StyleDeclaration = {
  [K in keyof CSSStyleDeclaration | CustomCSSProperty]?:
    | StyleValue
    | Reactive<StyleValue>;
};

// Global attributes shared by all HTML elements
export interface GlobalHTMLAttributes {
  id?: string;
  class?: string;
  className?: string; // Alias for class
  classList?: ClassList;
  style?: StyleDeclaration | string;
  title?: string;
  tabindex?: number;
  hidden?: boolean | "";
  lang?: string;
  dir?: "ltr" | "rtl" | "auto";
  slot?: string;
  accesskey?: string;
  autocapitalize?: "off" | "none" | "on" | "sentences" | "words" | "characters";
  autofocus?: boolean;
  contenteditable?: "true" | "false" | "plaintext-only" | "";
  draggable?: "true" | "false";
  enterkeyhint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
  inert?: boolean;
  inputmode?:
    | "none"
    | "text"
    | "decimal"
    | "numeric"
    | "tel"
    | "search"
    | "email"
    | "url";
  is?: string;
  itemid?: string;
  itemprop?: string;
  itemref?: string;
  itemscope?: boolean;
  itemtype?: string;
  nonce?: string;
  popover?: "auto" | "manual" | "";
  role?: string;
  spellcheck?: "true" | "false" | "";
  translate?: "yes" | "no" | "";

  // ARIA boolean string attributes
  "aria-checked"?: boolean | "true" | "false" | "mixed" | {};
  "aria-current"?:
    | boolean
    | "true"
    | "false"
    | "page"
    | "step"
    | "location"
    | "date"
    | "time"
    | {};
  "aria-disabled"?: boolean | "true" | "false" | {};
  "aria-expanded"?: boolean | "true" | "false" | {};
  "aria-pressed"?: boolean | "true" | "false" | "mixed" | {};
  "aria-selected"?: boolean | "true" | "false" | {};
}

// Anchor element attributes
export interface AnchorHTMLAttributes extends GlobalHTMLAttributes {
  href?: string;
  target?: "_self" | "_blank" | "_parent" | "_top" | string;
  rel?: string;
  download?: string;
  hreflang?: string;
  ping?: string;
  referrerpolicy?: ReferrerPolicy;
  type?: string;
}

// Button element attributes
export interface ButtonHTMLAttributes extends GlobalHTMLAttributes {
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  name?: string;
  value?: string;
  form?: string;
  formaction?: string;
  formenctype?:
    | "application/x-www-form-urlencoded"
    | "multipart/form-data"
    | "text/plain";
  formmethod?: "get" | "post" | "dialog";
  formnovalidate?: boolean;
  formtarget?: string;
  popovertarget?: string;
  popovertargetaction?: "toggle" | "show" | "hide";
}

// Input element attributes
export interface InputHTMLAttributes extends GlobalHTMLAttributes {
  type?:
    | "button"
    | "checkbox"
    | "color"
    | "date"
    | "datetime-local"
    | "email"
    | "file"
    | "hidden"
    | "image"
    | "month"
    | "number"
    | "password"
    | "radio"
    | "range"
    | "reset"
    | "search"
    | "submit"
    | "tel"
    | "text"
    | "time"
    | "url"
    | "week";
  value?: string | number | null;
  checked?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  name?: string;
  placeholder?: string;
  maxlength?: number;
  minlength?: number;
  max?: number | string;
  min?: number | string;
  step?: number | "any";
  pattern?: string;
  size?: number;
  multiple?: boolean;
  accept?: string;
  autocomplete?: string;
  list?: string;
  form?: string;
  formaction?: string;
  formenctype?: string;
  formmethod?: string;
  formnovalidate?: boolean;
  formtarget?: string;
  height?: number;
  width?: number;
  src?: string;
  alt?: string;
  capture?: "user" | "environment";
  dirname?: string;
  popovertarget?: string;
  popovertargetaction?: "toggle" | "show" | "hide";
}

// Textarea element attributes
export interface TextareaHTMLAttributes extends GlobalHTMLAttributes {
  value?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  name?: string;
  placeholder?: string;
  maxlength?: number;
  minlength?: number;
  rows?: number;
  cols?: number;
  wrap?: "hard" | "soft" | "off";
  autocomplete?: string;
  form?: string;
  dirname?: string;
}

// Select element attributes
export interface SelectHTMLAttributes extends GlobalHTMLAttributes {
  value?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  multiple?: boolean;
  size?: number;
  autocomplete?: string;
  form?: string;
}

// Option element attributes
export interface OptionHTMLAttributes extends GlobalHTMLAttributes {
  value?: string;
  disabled?: boolean;
  selected?: boolean;
  label?: string;
}

// Optgroup element attributes
export interface OptgroupHTMLAttributes extends GlobalHTMLAttributes {
  disabled?: boolean;
  label?: string;
}

// Form element attributes
export interface FormHTMLAttributes extends GlobalHTMLAttributes {
  action?: string;
  method?: "get" | "post" | "dialog";
  enctype?:
    | "application/x-www-form-urlencoded"
    | "multipart/form-data"
    | "text/plain";
  target?: string;
  novalidate?: boolean;
  autocomplete?: "on" | "off";
  name?: string;
  rel?: string;
}

// Label element attributes
export interface LabelHTMLAttributes extends GlobalHTMLAttributes {
  for?: string;
}

// Fieldset element attributes
export interface FieldsetHTMLAttributes extends GlobalHTMLAttributes {
  disabled?: boolean;
  form?: string;
  name?: string;
}

// Legend element attributes (no additional attributes)
export interface LegendHTMLAttributes extends GlobalHTMLAttributes {}

// Image element attributes
export interface ImageHTMLAttributes extends GlobalHTMLAttributes {
  src?: string;
  alt?: string | null;
  width?: number | string;
  height?: number | string;
  srcset?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
  decoding?: "sync" | "async" | "auto";
  crossorigin?: "anonymous" | "use-credentials" | "";
  usemap?: string;
  ismap?: boolean;
  referrerpolicy?: ReferrerPolicy;
  fetchpriority?: "high" | "low" | "auto";
}

// Picture element attributes (no additional attributes)
export interface PictureHTMLAttributes extends GlobalHTMLAttributes {}

// Video element attributes
export interface VideoHTMLAttributes extends GlobalHTMLAttributes {
  src?: string;
  poster?: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsinline?: boolean;
  preload?: "none" | "metadata" | "auto" | "";
  crossorigin?: "anonymous" | "use-credentials" | "";
  disablepictureinpicture?: boolean;
  disableremoteplayback?: boolean;
}

// Audio element attributes
export interface AudioHTMLAttributes extends GlobalHTMLAttributes {
  src?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  preload?: "none" | "metadata" | "auto" | "";
  crossorigin?: "anonymous" | "use-credentials" | "";
}

// Source element attributes
export interface SourceHTMLAttributes extends GlobalHTMLAttributes {
  src?: string;
  srcset?: string;
  sizes?: string;
  type?: string;
  media?: string;
  width?: number;
  height?: number;
}

// Track element attributes
export interface TrackHTMLAttributes extends GlobalHTMLAttributes {
  src?: string;
  srclang?: string;
  label?: string;
  kind?: "subtitles" | "captions" | "descriptions" | "chapters" | "metadata";
  default?: boolean;
}

// Canvas element attributes
export interface CanvasHTMLAttributes extends GlobalHTMLAttributes {
  width?: number | string;
  height?: number | string;
}

// IFrame element attributes
export interface IframeHTMLAttributes extends GlobalHTMLAttributes {
  src?: string;
  srcdoc?: string;
  name?: string;
  width?: number | string;
  height?: number | string;
  sandbox?: string;
  allow?: string;
  allowfullscreen?: boolean;
  loading?: "eager" | "lazy";
  referrerpolicy?: ReferrerPolicy;
}

// Table element attributes
export interface TableHTMLAttributes extends GlobalHTMLAttributes {}

// Table section attributes (thead, tbody, tfoot)
export interface TableSectionHTMLAttributes extends GlobalHTMLAttributes {}

// Table row attributes
export interface TableRowHTMLAttributes extends GlobalHTMLAttributes {}

// Table cell attributes (th, td)
export interface TableCellHTMLAttributes extends GlobalHTMLAttributes {
  colspan?: number;
  rowspan?: number;
  headers?: string;
  scope?: "row" | "col" | "rowgroup" | "colgroup";
  abbr?: string;
}

// Table caption attributes
export interface TableCaptionHTMLAttributes extends GlobalHTMLAttributes {}

// Colgroup/Col element attributes
export interface ColHTMLAttributes extends GlobalHTMLAttributes {
  span?: number;
}

// Link element attributes
export interface LinkHTMLAttributes extends GlobalHTMLAttributes {
  href?: string;
  rel?: string;
  type?: string;
  media?: string;
  as?: string;
  crossorigin?: "anonymous" | "use-credentials" | "";
  hreflang?: string;
  sizes?: string;
  imagesrcset?: string;
  imagesizes?: string;
  referrerpolicy?: ReferrerPolicy;
  integrity?: string;
  fetchpriority?: "high" | "low" | "auto";
  disabled?: boolean;
  blocking?: string;
}

// Script element attributes
export interface ScriptHTMLAttributes extends GlobalHTMLAttributes {
  src?: string;
  type?: string;
  async?: boolean;
  defer?: boolean;
  crossorigin?: "anonymous" | "use-credentials" | "";
  integrity?: string;
  nomodule?: boolean;
  referrerpolicy?: ReferrerPolicy;
  fetchpriority?: "high" | "low" | "auto";
  blocking?: string;
}

// Noscript element attributes (no additional attributes)
export interface NoscriptHTMLAttributes extends GlobalHTMLAttributes {}

// Style element attributes
export interface StyleHTMLAttributes extends GlobalHTMLAttributes {
  media?: string;
  blocking?: string;
}

// Meta element attributes
export interface MetaHTMLAttributes extends GlobalHTMLAttributes {
  name?: string;
  content?: string;
  charset?: string;
  "http-equiv"?: string;
  media?: string;
}

// Base element attributes
export interface BaseHTMLAttributes extends GlobalHTMLAttributes {
  href?: string;
  target?: string;
}

// Head element attributes (no additional attributes)
export interface HeadHTMLAttributes extends GlobalHTMLAttributes {}

// Title element attributes (no additional attributes)
export interface TitleHTMLAttributes extends GlobalHTMLAttributes {}

// Body element attributes (no additional attributes)
export interface BodyHTMLAttributes extends GlobalHTMLAttributes {}

// Html element attributes
export interface HtmlHTMLAttributes extends GlobalHTMLAttributes {
  xmlns?: string;
}

// Dialog element attributes
export interface DialogHTMLAttributes extends GlobalHTMLAttributes {
  open?: boolean;
}

// Details element attributes
export interface DetailsHTMLAttributes extends GlobalHTMLAttributes {
  open?: boolean;
  name?: string;
}

// Summary element attributes (no additional attributes)
export interface SummaryHTMLAttributes extends GlobalHTMLAttributes {}

// Meter element attributes
export interface MeterHTMLAttributes extends GlobalHTMLAttributes {
  value?: number;
  min?: number;
  max?: number;
  low?: number;
  high?: number;
  optimum?: number;
}

// Progress element attributes
export interface ProgressHTMLAttributes extends GlobalHTMLAttributes {
  value?: number;
  max?: number;
}

// Output element attributes
export interface OutputHTMLAttributes extends GlobalHTMLAttributes {
  for?: string;
  form?: string;
  name?: string;
}

// Menu element attributes (no additional attributes)
export interface MenuHTMLAttributes extends GlobalHTMLAttributes {}

// Time element attributes
export interface TimeHTMLAttributes extends GlobalHTMLAttributes {
  datetime?: string;
}

// Data element attributes
export interface DataHTMLAttributes extends GlobalHTMLAttributes {
  value?: string;
}

// Embed element attributes
export interface EmbedHTMLAttributes extends GlobalHTMLAttributes {
  src?: string;
  type?: string;
  width?: number | string;
  height?: number | string;
}

// Object element attributes
export interface ObjectHTMLAttributes extends GlobalHTMLAttributes {
  data?: string;
  type?: string;
  name?: string;
  usemap?: string;
  form?: string;
  width?: number | string;
  height?: number | string;
}

// Map element attributes
export interface MapHTMLAttributes extends GlobalHTMLAttributes {
  name?: string;
}

// Area element attributes
export interface AreaHTMLAttributes extends GlobalHTMLAttributes {
  alt?: string;
  coords?: string;
  download?: string;
  href?: string;
  ping?: string;
  referrerpolicy?: ReferrerPolicy;
  rel?: string;
  shape?: "rect" | "circle" | "poly" | "default";
  target?: string;
}

// Slot element attributes
export interface SlotHTMLAttributes extends GlobalHTMLAttributes {
  name?: string;
}

// Template element attributes
export interface TemplateHTMLAttributes extends GlobalHTMLAttributes {
  shadowrootmode?: "open" | "closed";
  shadowrootdelegatesfocus?: boolean;
}

// Blockquote element attributes
export interface BlockquoteHTMLAttributes extends GlobalHTMLAttributes {
  cite?: string;
}

// Quote element attributes (q)
export interface QuoteHTMLAttributes extends GlobalHTMLAttributes {
  cite?: string;
}

// Ins/Del element attributes
export interface ModHTMLAttributes extends GlobalHTMLAttributes {
  cite?: string;
  datetime?: string;
}

// List item attributes
export interface LiHTMLAttributes extends GlobalHTMLAttributes {
  value?: number;
}

// Ordered list attributes
export interface OlHTMLAttributes extends GlobalHTMLAttributes {
  reversed?: boolean;
  start?: number;
  type?: "1" | "a" | "A" | "i" | "I";
}

// Flat mapping from tag name to attribute type
export interface HTMLAttributesByTagName {
  a: AnchorHTMLAttributes;
  abbr: GlobalHTMLAttributes;
  address: GlobalHTMLAttributes;
  area: AreaHTMLAttributes;
  article: GlobalHTMLAttributes;
  aside: GlobalHTMLAttributes;
  audio: AudioHTMLAttributes;
  b: GlobalHTMLAttributes;
  base: BaseHTMLAttributes;
  bdi: GlobalHTMLAttributes;
  bdo: GlobalHTMLAttributes;
  blockquote: BlockquoteHTMLAttributes;
  body: BodyHTMLAttributes;
  br: GlobalHTMLAttributes;
  button: ButtonHTMLAttributes;
  canvas: CanvasHTMLAttributes;
  caption: TableCaptionHTMLAttributes;
  cite: GlobalHTMLAttributes;
  code: GlobalHTMLAttributes;
  col: ColHTMLAttributes;
  colgroup: ColHTMLAttributes;
  data: DataHTMLAttributes;
  datalist: GlobalHTMLAttributes;
  dd: GlobalHTMLAttributes;
  del: ModHTMLAttributes;
  details: DetailsHTMLAttributes;
  dfn: GlobalHTMLAttributes;
  dialog: DialogHTMLAttributes;
  div: GlobalHTMLAttributes;
  dl: GlobalHTMLAttributes;
  dt: GlobalHTMLAttributes;
  em: GlobalHTMLAttributes;
  embed: EmbedHTMLAttributes;
  fieldset: FieldsetHTMLAttributes;
  figcaption: GlobalHTMLAttributes;
  figure: GlobalHTMLAttributes;
  footer: GlobalHTMLAttributes;
  form: FormHTMLAttributes;
  h1: GlobalHTMLAttributes;
  h2: GlobalHTMLAttributes;
  h3: GlobalHTMLAttributes;
  h4: GlobalHTMLAttributes;
  h5: GlobalHTMLAttributes;
  h6: GlobalHTMLAttributes;
  head: HeadHTMLAttributes;
  header: GlobalHTMLAttributes;
  hgroup: GlobalHTMLAttributes;
  hr: GlobalHTMLAttributes;
  html: HtmlHTMLAttributes;
  i: GlobalHTMLAttributes;
  iframe: IframeHTMLAttributes;
  img: ImageHTMLAttributes;
  input: InputHTMLAttributes;
  ins: ModHTMLAttributes;
  kbd: GlobalHTMLAttributes;
  label: LabelHTMLAttributes;
  legend: LegendHTMLAttributes;
  li: LiHTMLAttributes;
  link: LinkHTMLAttributes;
  main: GlobalHTMLAttributes;
  map: MapHTMLAttributes;
  mark: GlobalHTMLAttributes;
  menu: MenuHTMLAttributes;
  meta: MetaHTMLAttributes;
  meter: MeterHTMLAttributes;
  nav: GlobalHTMLAttributes;
  noscript: NoscriptHTMLAttributes;
  object: ObjectHTMLAttributes;
  ol: OlHTMLAttributes;
  optgroup: OptgroupHTMLAttributes;
  option: OptionHTMLAttributes;
  output: OutputHTMLAttributes;
  p: GlobalHTMLAttributes;
  picture: PictureHTMLAttributes;
  pre: GlobalHTMLAttributes;
  progress: ProgressHTMLAttributes;
  q: QuoteHTMLAttributes;
  rp: GlobalHTMLAttributes;
  rt: GlobalHTMLAttributes;
  ruby: GlobalHTMLAttributes;
  s: GlobalHTMLAttributes;
  samp: GlobalHTMLAttributes;
  script: ScriptHTMLAttributes;
  search: GlobalHTMLAttributes;
  section: GlobalHTMLAttributes;
  select: SelectHTMLAttributes;
  slot: SlotHTMLAttributes;
  small: GlobalHTMLAttributes;
  source: SourceHTMLAttributes;
  span: GlobalHTMLAttributes;
  strong: GlobalHTMLAttributes;
  style: StyleHTMLAttributes;
  sub: GlobalHTMLAttributes;
  summary: SummaryHTMLAttributes;
  sup: GlobalHTMLAttributes;
  table: TableHTMLAttributes;
  tbody: TableSectionHTMLAttributes;
  td: TableCellHTMLAttributes;
  template: TemplateHTMLAttributes;
  textarea: TextareaHTMLAttributes;
  tfoot: TableSectionHTMLAttributes;
  th: TableCellHTMLAttributes;
  thead: TableSectionHTMLAttributes;
  time: TimeHTMLAttributes;
  title: TitleHTMLAttributes;
  tr: TableRowHTMLAttributes;
  track: TrackHTMLAttributes;
  u: GlobalHTMLAttributes;
  ul: GlobalHTMLAttributes;
  var: GlobalHTMLAttributes;
  video: VideoHTMLAttributes;
  wbr: GlobalHTMLAttributes;
}

// Lookup with fallback chain: HTML → SVG → MathML → global
export type AttributesFor<T extends string> =
  T extends keyof HTMLAttributesByTagName
    ? HTMLAttributesByTagName[T]
    : T extends keyof SVGElementTagNameMap
      ? SVGAttributes
      : T extends keyof MathMLElementTagNameMap
        ? MathMLAttributes
        : GlobalHTMLAttributes;

// Map tag name to element type for property access
export type ElementTypeFor<T extends string> =
  T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T]
    : T extends keyof SVGElementTagNameMap
      ? SVGElementTagNameMap[T]
      : T extends keyof MathMLElementTagNameMap
        ? MathMLElementTagNameMap[T]
        : Element;

// SVG attributes
export interface SVGAttributes {
  id?: string;
  class?: string;
  className?: string;
  style?: StyleDeclaration | string;
  slot?: string;
  viewBox?: string;
  xmlns?: string;
  fill?: string;
  stroke?: string;
  "stroke-width"?: number | string;
  "stroke-linecap"?: "butt" | "round" | "square";
  "stroke-linejoin"?: "miter" | "round" | "bevel";
  d?: string;
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  cx?: number | string;
  cy?: number | string;
  r?: number | string;
  rx?: number | string;
  ry?: number | string;
  x1?: number | string;
  y1?: number | string;
  x2?: number | string;
  y2?: number | string;
  points?: string;
  transform?: string;
  opacity?: number | string;
  "fill-opacity"?: number | string;
  "stroke-opacity"?: number | string;
  "clip-path"?: string;
  "clip-rule"?: "nonzero" | "evenodd";
  "fill-rule"?: "nonzero" | "evenodd";
  mask?: string;
  "font-family"?: string;
  "font-size"?: number | string;
  "font-weight"?: number | string;
  "text-anchor"?: "start" | "middle" | "end";
  "dominant-baseline"?: string;
  href?: string;
  preserveAspectRatio?: string;
  role?: string;
  tabindex?: number;
  focusable?: "true" | "false";
}

// MathML attributes
export interface MathMLAttributes {
  id?: string;
  class?: string;
  className?: string;
  style?: StyleDeclaration | string;
  slot?: string;
  displaystyle?: "true" | "false";
  scriptlevel?: number | string;
  mathvariant?: string;
  mathsize?: string;
  dir?: "ltr" | "rtl";
}

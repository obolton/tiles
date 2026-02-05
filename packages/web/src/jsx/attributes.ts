import { isReactive } from "@/utils/reactivity";
import type { ClassList } from "./html-attributes";
import type { StyleDeclaration, StyleValue } from "@/jsx/html-attributes";

/**
 * Maps JSX attribute names to their HTML equivalents.
 */
export function mapAttributeName(name: string): string {
  if (name === "className") {
    return "class";
  }
  if (name === "htmlFor") {
    return "for";
  }
  return name;
}

/**
 * Transforms CSS property names to kebab-case.
 */
export function transformCSSProperty(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function isValidStyleValue(value: unknown): value is string | number {
  if (typeof value === "string") {
    return value.trim() !== "";
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  return false;
}

/**
 * ARIA attributes that accept boolean values but are serialized as "true"/"false" strings.
 * Used by dom.ts and server.ts for runtime attribute handling.
 */
export const BOOLEAN_STRING_ATTRIBUTES = new Set([
  "aria-checked",
  "aria-current",
  "aria-expanded",
  "aria-pressed",
  "aria-selected",
]);

export function applyClassList(
  element: Element,
  value: ClassList,
  signal?: AbortSignal,
): void {
  // Remove old classes
  for (const className of element.classList.values()) {
    if (!(className in value)) {
      element.classList.remove(className);
    }
  }

  // Apply classes
  for (const [className, enabled] of Object.entries(value)) {
    if (isReactive(enabled)) {
      element.classList.toggle(className, !!enabled.value);
      enabled.subscribe(() => {
        element.classList.toggle(className, !!enabled.value);
      }, signal);
    } else {
      element.classList.toggle(className, !!enabled);
    }
  }
}

/**
 * Serializes a class list to a string.
 */
export function serializeClassList(value: ClassList): string {
  return Object.entries(value)
    .filter(([, enabled]) => (isReactive(enabled) ? enabled.value : enabled))
    .map(([name]) => name)
    .join(" ");
}

// TODO: Add proper CSS value sanitization for SSR
/**
 * Serializes a style object to a string.
 */
export function serializeStyles(styles: StyleDeclaration) {
  const rules: string[] = [];
  for (const [name, styleValue] of Object.entries(styles)) {
    const value = isReactive(styleValue) ? styleValue.value : styleValue;
    if (isValidStyleValue(value)) {
      rules.push(transformCSSProperty(name) + ":" + value);
    }
  }
  return rules.join(";");
}

function applyStyleValue(
  style: CSSStyleDeclaration,
  property: string,
  value: StyleValue,
): void {
  if (isValidStyleValue(value)) {
    style.setProperty(property, value.toString());
  } else {
    style.removeProperty(property);
  }
}

/**
 * Applies a style object to an element.
 */
export function applyStyleObject(
  element: HTMLElement | SVGElement,
  value: StyleDeclaration,
  signal?: AbortSignal,
): void {
  for (const [property, styleValue] of Object.entries(value)) {
    const cssProperty = transformCSSProperty(property);
    if (isReactive(styleValue)) {
      applyStyleValue(element.style, cssProperty, styleValue.value);
      styleValue.subscribe(() => {
        applyStyleValue(element.style, cssProperty, styleValue.value);
      }, signal);
    } else {
      applyStyleValue(element.style, cssProperty, styleValue);
    }
  }
}

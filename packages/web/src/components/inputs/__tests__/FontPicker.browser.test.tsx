import "@/styles";
import "@/elements/list-select/ListSelect";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "jsx/dom";
import { reactive } from "carillon";
import { getFontConfig, type FontId } from "fonts/config";
import FontPicker from "../FontPicker";

vi.mock("@/utils/fonts", () => ({ loadFontPreviews: () => Promise.resolve() }));

function renderPicker(font: FontId | null) {
  const value = reactive<FontId | null>(font);
  const nodes = render(<FontPicker label="Heading" value={value} onChange={() => {}} />);
  document.body.append(...nodes);

  const picker = document.querySelector("list-select");
  if (!picker) {
    throw new Error("Missing picker");
  }
  return { picker, value };
}

function selectedLabel(picker: HTMLElement) {
  const label = picker.querySelector<HTMLElement>(':scope > [slot="label"]');
  if (!label) {
    throw new Error("Missing selected label");
  }
  return label;
}

function pickerLabel(picker: HTMLElement) {
  const label = picker.shadowRoot?.getElementById("button-label");
  if (!label) {
    throw new Error("Missing picker label");
  }
  return label;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("FontPicker", () => {
  test("shows the selected font name in that font", async () => {
    const font = getFontConfig("pacifico");
    const { picker } = renderPicker("pacifico");

    const label = await vi.waitFor(() => selectedLabel(picker));
    expect(label.textContent).toBe(font.family);
    expect(getComputedStyle(label).fontFamily).toContain(font.previewFamily);
  });

  test("keeps the picker label in the UI font", () => {
    const { picker } = renderPicker(null);
    const uiFont = getComputedStyle(pickerLabel(picker)).fontFamily;

    picker.remove();
    const { picker: selected } = renderPicker("pacifico");

    expect(pickerLabel(selected).textContent).toBe("Heading");
    expect(getComputedStyle(pickerLabel(selected)).fontFamily).toBe(uiFont);
  });

  test("updates the selected font name when the value changes", () => {
    const font = getFontConfig("lora");
    const { picker, value } = renderPicker("pacifico");

    value.value = "lora";

    const label = selectedLabel(picker);
    expect(label.textContent).toBe(font.family);
    expect(getComputedStyle(label).fontFamily).toContain(font.previewFamily);
    expect(getComputedStyle(pickerLabel(picker)).fontFamily).not.toContain(font.family);
  });
});

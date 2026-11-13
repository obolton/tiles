import "@/styles";
import "../ListSelect";
import { afterEach, describe, expect, test } from "vitest";
import { hydrate } from "jsx/dom";
import { renderToString } from "jsx/server";
import ListGroup from "@/components/lists/ListGroup";
import ListOption from "@/components/lists/ListOption";

function Select() {
  return (
    <list-select aria-label="Sort by" showvalue value="b">
      <svg slot="default-icon" />
      <ListGroup label="First">
        <ListOption value="a">Option A</ListOption>
        <ListOption value="b">Option B</ListOption>
      </ListGroup>
      <ListGroup label="Second">
        <ListOption value="c">Option C</ListOption>
      </ListGroup>
    </list-select>
  );
}

function select() {
  const element = document.querySelector("list-select");
  if (!element) {
    throw new Error("Missing list-select");
  }
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("ListSelect", () => {
  test("keeps its options intact when upgraded before hydration", () => {
    // Parsing server-rendered markup upgrades the element before hydration runs
    document.body.innerHTML = renderToString(<Select />);
    hydrate(<Select />, document.body);

    const options = [...select().querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((option) => option.dataset.value)).toEqual(["a", "b", "c"]);
    expect(options.filter((option) => option.ariaSelected === "true")).toEqual([options[1]]);
    expect(select().querySelector('[slot="label"]')?.textContent).toBe("Option B");
  });

  test("separates groups without a trailing separator after the last group", () => {
    document.body.innerHTML = renderToString(<Select />);
    hydrate(<Select />, document.body);

    const [first, second] = select().querySelectorAll('[role="group"]');
    if (!first || !second) {
      throw new Error("Missing groups");
    }
    expect(getComputedStyle(first, "::after").content).not.toBe("none");
    expect(getComputedStyle(second, "::after").content).toBe("none");
  });
});

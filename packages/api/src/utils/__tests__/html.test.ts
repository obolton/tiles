import { describe, expect, test } from "vitest";
import { escapeHtml } from "../html.ts";

describe("escapeHtml", () => {
  test("escapes HTML special characters", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'quotes'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;quotes&#39;",
    );
  });

  test("leaves safe strings unchanged", () => {
    expect(escapeHtml("Jane Doe")).toBe("Jane Doe");
    expect(escapeHtml("")).toBe("");
  });

  test("does not double-escape already escaped entities", () => {
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });
});

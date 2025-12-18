import { describe, test, expect } from "vitest";
import { findLanguageConfig, loadLanguage } from "../languages";

describe("findLanguageConfig", () => {
  test("returns Plain Text config for empty string", () => {
    const config = findLanguageConfig("");
    expect(config).toBeDefined();
    expect(config?.name).toBe("Plain Text");
    expect(config?.id).toBe("");
  });

  test("returns config by exact id match", () => {
    const config = findLanguageConfig("javascript");
    expect(config).toBeDefined();
    expect(config?.name).toBe("JavaScript");
  });

  test("returns config by alias", () => {
    const config = findLanguageConfig("js");
    expect(config).toBeDefined();
    expect(config?.name).toBe("JavaScript");
  });

  test("returns config by alias case-insensitively", () => {
    const config = findLanguageConfig("JS");
    expect(config).toBeDefined();
    expect(config?.name).toBe("JavaScript");
  });

  test("returns config for TypeScript alias", () => {
    const config = findLanguageConfig("typescript");
    expect(config).toBeDefined();
    expect(config?.name).toBe("JavaScript");
  });

  test("returns config for tsx alias", () => {
    const config = findLanguageConfig("tsx");
    expect(config).toBeDefined();
    expect(config?.name).toBe("JavaScript");
  });

  test("returns undefined for unknown language", () => {
    const config = findLanguageConfig("unknown-language");
    expect(config).toBeUndefined();
  });

  test("returns config for html", () => {
    const config = findLanguageConfig("html");
    expect(config).toBeDefined();
    expect(config?.name).toBe("HTML");
  });

  test("returns config for css", () => {
    const config = findLanguageConfig("css");
    expect(config).toBeDefined();
    expect(config?.name).toBe("CSS");
  });

  test("returns config for json", () => {
    const config = findLanguageConfig("json");
    expect(config).toBeDefined();
    expect(config?.name).toBe("JSON");
  });
});

describe("loadLanguage", () => {
  test("returns null for empty string (Plain Text)", async () => {
    const support = await loadLanguage("");
    expect(support).toBeNull();
  });

  test("returns null for unknown language", async () => {
    const support = await loadLanguage("unknown");
    expect(support).toBeNull();
  });

  test("loads JavaScript language support", async () => {
    const support = await loadLanguage("javascript");
    expect(support).not.toBeNull();
    expect(support?.language).toBeDefined();
  });

  test("loads language support by alias", async () => {
    const support = await loadLanguage("js");
    expect(support).not.toBeNull();
  });

  test("caches loaded language support", async () => {
    const support1 = await loadLanguage("javascript");
    const support2 = await loadLanguage("javascript");
    expect(support1).toBe(support2);
  });

  test("loads HTML language support", async () => {
    const support = await loadLanguage("html");
    expect(support).not.toBeNull();
  });

  test("loads CSS language support", async () => {
    const support = await loadLanguage("css");
    expect(support).not.toBeNull();
  });

  test("loads JSON language support", async () => {
    const support = await loadLanguage("json");
    expect(support).not.toBeNull();
  });
});

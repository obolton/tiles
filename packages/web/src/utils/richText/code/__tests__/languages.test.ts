import { describe, test, expect } from "vitest";
import { findLanguageConfig, loadLanguage, SUPPORTED_LANGUAGES } from "../languages";

describe("SUPPORTED_LANGUAGES", () => {
  test("has Plain Text as the first entry", () => {
    expect(SUPPORTED_LANGUAGES[0]?.id).toBe("");
    expect(SUPPORTED_LANGUAGES[0]?.name).toBe("Plain Text");
  });

  test("has unique ids", () => {
    const ids = SUPPORTED_LANGUAGES.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("has no duplicate aliases", () => {
    const seen = new Map<string, string>();
    for (const config of SUPPORTED_LANGUAGES) {
      for (const alias of config.aliases) {
        expect(
          seen.has(alias),
          `alias "${alias}" is used by both "${seen.get(alias)}" and "${config.id}"`,
        ).toBe(false);
        seen.set(alias, config.id);
      }
    }
  });

  test("has no aliases that collide with another language id", () => {
    const ids = new Set(SUPPORTED_LANGUAGES.map((l) => l.id));
    for (const config of SUPPORTED_LANGUAGES) {
      for (const alias of config.aliases) {
        if (ids.has(alias)) {
          expect.fail(`alias "${alias}" on "${config.id}" collides with another language id`);
        }
      }
    }
  });

  test("all non-Plain Text entries have a load function", () => {
    for (const config of SUPPORTED_LANGUAGES) {
      if (config.id !== "") {
        expect(config.load, `${config.name} is missing a load function`).toBeDefined();
      }
    }
  });

  test("is sorted alphabetically by id after Plain Text", () => {
    const ids = SUPPORTED_LANGUAGES.slice(1).map((l) => l.id);
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });
});

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

  test("returns config case-insensitively", () => {
    const config = findLanguageConfig("JavaScript");
    expect(config).toBeDefined();
    expect(config?.name).toBe("JavaScript");
  });

  test("returns undefined for unknown language", () => {
    expect(findLanguageConfig("unknown-language")).toBeUndefined();
  });

  test.each(SUPPORTED_LANGUAGES.map((l) => [l.id, l.name] as const))(
    "finds %s by id",
    (id, name) => {
      const config = findLanguageConfig(id);
      expect(config).toBeDefined();
      expect(config?.name).toBe(name);
    },
  );

  test.each([
    ["js", "JavaScript"],
    ["jsx", "JavaScript"],
    ["ts", "TypeScript"],
    ["tsx", "TypeScript"],
    ["py", "Python"],
    ["rb", "Ruby"],
    ["rs", "Rust"],
    ["go", "Go"],
    ["golang", "Go"],
    ["bash", "Shell"],
    ["sh", "Shell"],
    ["yml", "YAML"],
    ["md", "Markdown"],
    ["cs", "C#"],
    ["kt", "Kotlin"],
    ["h", "C"],
    ["hpp", "C++"],
    ["htm", "HTML"],
    ["sass", "SCSS"],
    ["patch", "Diff"],
    ["docker", "Dockerfile"],
    ["svg", "XML"],
    ["ps1", "PowerShell"],
    ["pl", "Perl"],
  ] as const)("resolves alias %s to %s", (alias, name) => {
    const config = findLanguageConfig(alias);
    expect(config).toBeDefined();
    expect(config?.name).toBe(name);
  });
});

describe("loadLanguage", () => {
  test("returns null for Plain Text", async () => {
    const support = await loadLanguage("");
    expect(support).toBeNull();
  });

  test("returns null for unknown language", async () => {
    const support = await loadLanguage("unknown");
    expect(support).toBeNull();
  });

  test("caches loaded language support", async () => {
    const support1 = await loadLanguage("javascript");
    const support2 = await loadLanguage("javascript");
    expect(support1).toBe(support2);
  });

  test("resolves aliases to the same cached instance", async () => {
    const byId = await loadLanguage("javascript");
    const byAlias = await loadLanguage("js");
    expect(byId).toBe(byAlias);
  });

  describe("official packages", () => {
    test.each([
      "javascript",
      "typescript",
      "html",
      "css",
      "json",
      "python",
      "java",
      "c",
      "cpp",
      "rust",
      "go",
      "xml",
      "sql",
      "markdown",
      "php",
      "yaml",
      "scss",
      "less",
    ])("loads %s", async (id) => {
      const support = await loadLanguage(id);
      expect(support).not.toBeNull();
      expect(support?.language).toBeDefined();
    });
  });

  describe("legacy modes", () => {
    test.each([
      "csharp",
      "dart",
      "diff",
      "dockerfile",
      "kotlin",
      "lua",
      "perl",
      "powershell",
      "r",
      "ruby",
      "scala",
      "shell",
      "swift",
      "toml",
    ])("loads %s", async (id) => {
      const support = await loadLanguage(id);
      expect(support).not.toBeNull();
      expect(support?.language).toBeDefined();
    });
  });
});

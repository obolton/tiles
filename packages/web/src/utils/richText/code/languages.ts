import type { LanguageSupport } from "@codemirror/language";

export interface LanguageConfig {
  id: string;
  name: string;
  aliases: string[];
  load?: () => Promise<LanguageSupport>;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: "",
    name: "Plain Text",
    aliases: ["text", "txt", "plaintext"],
  },
  {
    id: "javascript",
    name: "JavaScript",
    aliases: ["js", "jsx", "ts", "tsx", "typescript"],
    load: () =>
      import("@codemirror/lang-javascript").then((m) =>
        m.javascript({ jsx: true, typescript: true }),
      ),
  },
  {
    id: "html",
    name: "HTML",
    aliases: ["htm"],
    load: () => import("@codemirror/lang-html").then((m) => m.html()),
  },
  {
    id: "css",
    name: "CSS",
    aliases: ["scss", "less"],
    load: () => import("@codemirror/lang-css").then((m) => m.css()),
  },
  {
    id: "json",
    name: "JSON",
    aliases: ["jsonc"],
    load: () => import("@codemirror/lang-json").then((m) => m.json()),
  },
];

const languageLookup = new Map<string, LanguageConfig>();
for (const config of SUPPORTED_LANGUAGES) {
  languageLookup.set(config.id, config);
  for (const alias of config.aliases) {
    languageLookup.set(alias, config);
  }
}

// Cache for loaded language extensions
const languageCache = new Map<string, LanguageSupport>();

export function findLanguageConfig(
  language: string,
): LanguageConfig | undefined {
  return languageLookup.get(language.toLowerCase());
}

export async function loadLanguage(
  language: string,
): Promise<LanguageSupport | null> {
  const config = findLanguageConfig(language);
  if (!config?.load) {
    return null;
  }

  const cached = languageCache.get(config.id);
  if (cached) {
    return cached;
  }

  const loaded = await config.load();
  languageCache.set(config.id, loaded);
  return loaded;
}

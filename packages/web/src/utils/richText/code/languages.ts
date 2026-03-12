import {
  LanguageSupport,
  StreamLanguage,
  type StreamParser,
} from "@codemirror/language";

export interface LanguageConfig {
  id: string;
  name: string;
  aliases: string[];
  load?: () => Promise<LanguageSupport>;
}

function legacy<T>(
  importParser: () => Promise<StreamParser<T>>,
): () => Promise<LanguageSupport> {
  return () =>
    importParser().then(
      (parser) => new LanguageSupport(StreamLanguage.define(parser)),
    );
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: "",
    name: "Plain Text",
    aliases: ["text", "txt", "plaintext"],
  },
  {
    id: "c",
    name: "C",
    aliases: ["h"],
    load: () => import("@codemirror/lang-cpp").then((m) => m.cpp()),
  },
  {
    id: "cpp",
    name: "C++",
    aliases: ["cxx", "cc", "hpp", "hxx"],
    load: () => import("@codemirror/lang-cpp").then((m) => m.cpp()),
  },
  {
    id: "csharp",
    name: "C#",
    aliases: ["cs"],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/clike").then((m) => m.csharp),
    ),
  },
  {
    id: "css",
    name: "CSS",
    aliases: [],
    load: () => import("@codemirror/lang-css").then((m) => m.css()),
  },
  {
    id: "dart",
    name: "Dart",
    aliases: [],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/clike").then((m) => m.dart),
    ),
  },
  {
    id: "diff",
    name: "Diff",
    aliases: ["patch"],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/diff").then((m) => m.diff),
    ),
  },
  {
    id: "dockerfile",
    name: "Dockerfile",
    aliases: ["docker"],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/dockerfile").then(
        (m) => m.dockerFile,
      ),
    ),
  },
  {
    id: "go",
    name: "Go",
    aliases: ["golang"],
    load: () => import("@codemirror/lang-go").then((m) => m.go()),
  },
  {
    id: "html",
    name: "HTML",
    aliases: ["htm"],
    load: () => import("@codemirror/lang-html").then((m) => m.html()),
  },
  {
    id: "java",
    name: "Java",
    aliases: [],
    load: () => import("@codemirror/lang-java").then((m) => m.java()),
  },
  {
    id: "javascript",
    name: "JavaScript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    load: () =>
      import("@codemirror/lang-javascript").then((m) =>
        m.javascript({ jsx: true, typescript: true }),
      ),
  },
  {
    id: "json",
    name: "JSON",
    aliases: ["jsonc", "json5"],
    load: () => import("@codemirror/lang-json").then((m) => m.json()),
  },
  {
    id: "kotlin",
    name: "Kotlin",
    aliases: ["kt", "kts"],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/clike").then((m) => m.kotlin),
    ),
  },
  {
    id: "less",
    name: "Less",
    aliases: [],
    load: () => import("@codemirror/lang-less").then((m) => m.less()),
  },
  {
    id: "lua",
    name: "Lua",
    aliases: [],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/lua").then((m) => m.lua),
    ),
  },
  {
    id: "markdown",
    name: "Markdown",
    aliases: ["md", "mdx"],
    load: () =>
      import("@codemirror/lang-markdown").then((m) => m.markdown()),
  },
  {
    id: "perl",
    name: "Perl",
    aliases: ["pl", "pm"],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/perl").then((m) => m.perl),
    ),
  },
  {
    id: "php",
    name: "PHP",
    aliases: [],
    load: () => import("@codemirror/lang-php").then((m) => m.php()),
  },
  {
    id: "powershell",
    name: "PowerShell",
    aliases: ["ps1", "psm1"],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/powershell").then(
        (m) => m.powerShell,
      ),
    ),
  },
  {
    id: "python",
    name: "Python",
    aliases: ["py"],
    load: () => import("@codemirror/lang-python").then((m) => m.python()),
  },
  {
    id: "r",
    name: "R",
    aliases: ["rscript"],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/r").then((m) => m.r),
    ),
  },
  {
    id: "ruby",
    name: "Ruby",
    aliases: ["rb"],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/ruby").then((m) => m.ruby),
    ),
  },
  {
    id: "rust",
    name: "Rust",
    aliases: ["rs"],
    load: () => import("@codemirror/lang-rust").then((m) => m.rust()),
  },
  {
    id: "scala",
    name: "Scala",
    aliases: [],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/clike").then((m) => m.scala),
    ),
  },
  {
    id: "scss",
    name: "SCSS",
    aliases: ["sass"],
    load: () => import("@codemirror/lang-sass").then((m) => m.sass()),
  },
  {
    id: "shell",
    name: "Shell",
    aliases: ["bash", "sh", "zsh", "fish"],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/shell").then((m) => m.shell),
    ),
  },
  {
    id: "sql",
    name: "SQL",
    aliases: ["mysql", "postgresql", "sqlite"],
    load: () => import("@codemirror/lang-sql").then((m) => m.sql()),
  },
  {
    id: "swift",
    name: "Swift",
    aliases: [],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/swift").then((m) => m.swift),
    ),
  },
  {
    id: "toml",
    name: "TOML",
    aliases: [],
    load: legacy(() =>
      import("@codemirror/legacy-modes/mode/toml").then((m) => m.toml),
    ),
  },
  {
    id: "typescript",
    name: "TypeScript",
    aliases: ["ts", "tsx", "mts", "cts"],
    load: () =>
      import("@codemirror/lang-javascript").then((m) =>
        m.javascript({ jsx: true, typescript: true }),
      ),
  },
  {
    id: "xml",
    name: "XML",
    aliases: ["svg", "xsl", "xsd", "rss"],
    load: () => import("@codemirror/lang-xml").then((m) => m.xml()),
  },
  {
    id: "yaml",
    name: "YAML",
    aliases: ["yml"],
    load: () => import("@codemirror/lang-yaml").then((m) => m.yaml()),
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

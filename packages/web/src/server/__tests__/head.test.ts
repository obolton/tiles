import { describe, expect, test, vi } from "vitest";
import { renderHead, type HeadOptions } from "../head";
import { SITE_DESCRIPTION, SITE_NAME } from "@/constants/site";

// The asset manifest only exists in production builds.
vi.mock("../assets", () => ({
  resolveImport: (path: string) => path,
}));

function render(options: Partial<HeadOptions> = {}) {
  return renderHead({
    url: new URL("https://tiles.example/pages/abc?version=123"),
    stylesheets: [],
    metadata: {},
    ...options,
  });
}

describe("renderHead", () => {
  test("emits viewport, icon and theme color", () => {
    const head = render();
    expect(head).toContain(`<meta charset="utf-8">`);
    expect(head).toContain(`<meta name="viewport" content="width=device-width, initial-scale=1">`);
    expect(head).toContain(`<meta name="theme-color" content="#ffffff">`);
    expect(head).toContain(`<link rel="icon" href="/favicon.svg" type="image/svg+xml">`);
  });

  test("falls back to the site title and description", () => {
    const head = render();
    expect(head).toContain(`<title>${SITE_NAME}</title>`);
    expect(head).toContain(`<meta name="description" content="${SITE_DESCRIPTION}">`);
    expect(head).toContain(`<meta property="og:title" content="${SITE_NAME}">`);
  });

  test("uses the route title and description", () => {
    const head = render({
      title: "My Page - Tiles",
      description: "A page about things.",
    });
    expect(head).toContain(`<title>My Page - Tiles</title>`);
    expect(head).toContain(`<meta name="description" content="A page about things.">`);
    expect(head).toContain(`<meta property="og:title" content="My Page - Tiles">`);
    expect(head).toContain(`<meta property="og:description" content="A page about things.">`);
    expect(head).toContain(`<meta name="twitter:card" content="summary">`);
    expect(head).toContain(`<meta name="twitter:title" content="My Page - Tiles">`);
  });

  test("strips the query string from the canonical URL", () => {
    expect(render()).toContain(
      `<meta property="og:url" content="https://tiles.example/pages/abc">`,
    );
  });

  test("escapes user-supplied values", () => {
    const head = render({ title: `<script>"x"</script>`, description: `a & "b"` });
    expect(head).not.toContain("<script>");
    expect(head).toContain(`<title>&lt;script&gt;&quot;x&quot;&lt;/script&gt;</title>`);
    expect(head).toContain(`<meta name="description" content="a &amp; &quot;b&quot;">`);
  });

  test("includes stylesheets, metadata and hydration script", () => {
    const head = render({
      stylesheets: ["/a.css"],
      metadata: {
        links: [{ rel: "preload", href: "/font.woff2", as: "font", crossorigin: true }],
        styles: [{ content: "body { color: red }" }],
        scripts: [{ src: "/src/global.ts" }],
      },
      hydrate: "immediate",
    });
    expect(head).toContain(`<link rel="stylesheet" href="/a.css">`);
    expect(head).toContain(`<link rel="preload" href="/font.woff2" as="font" crossorigin>`);
    expect(head).toContain(`<style>body { color: red }</style>`);
    expect(head).toContain(`<script type="module" src="/src/global.ts"></script>`);
    expect(head).toContain(`<script type="module" src="/src/server/hydrate.ts"></script>`);
    expect(head.startsWith("<head>")).toBe(true);
    expect(head.endsWith("</head>")).toBe(true);
  });
});

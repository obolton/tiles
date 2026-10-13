import { Readable } from "node:stream";
import { WritableStream } from "htmlparser2/WritableStream";

type LinkMetadata = {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogSiteName: string | null;
  ogImageUrl: string | null;
};

const FETCH_TIMEOUT_MS = 10000;
const HTML_CONTENT_TYPES = ["text/html", "application/xhtml+xml", "application/xml"];

export function matchContentType(contentType: string, allowedTypes: string[]): boolean {
  const mimeType = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return allowedTypes.includes(mimeType);
}

function resolveImageUrl(imageUrl: string, baseUrl: string): string | null {
  try {
    return new URL(imageUrl, baseUrl).href;
  } catch {
    return null;
  }
}

async function parseDocument(url: string, language: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml",
      "Accept-Language": language,
      "User-Agent": "facebookexternalhit/1.1",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Link metadata: Failed to fetch ${url}: [${response.status}] ${response.statusText}`,
    );
  }

  const contentType = response.headers.get("Content-Type");
  if (!contentType || !matchContentType(contentType, HTML_CONTENT_TYPES)) {
    throw new Error(`Link metadata: Invalid content type for ${url}: ${contentType}`);
  }

  const body = response.body;
  if (!body) {
    throw new Error(`Link metadata: Failed to fetch ${url}: No content returned`);
  }

  return new Promise<LinkMetadata>((resolve, reject) => {
    const data: LinkMetadata = {
      title: null,
      description: null,
      ogTitle: null,
      ogDescription: null,
      ogSiteName: null,
      ogImageUrl: null,
    };
    let tag: string | null = null;
    let tagText = "";
    const parserStream = new WritableStream({
      onopentag: (name, attributes) => {
        tag = name;
        tagText = "";
        if (name === "meta") {
          if (attributes.name === "description") {
            const content = attributes.content?.trim();
            if (!content) {
              return;
            }
            data.description = content;
          }
          const ogProperty = attributes.property?.startsWith("og:")
            ? attributes.property
            : attributes.name?.startsWith("og:")
              ? attributes.name
              : null;
          if (ogProperty) {
            const content = attributes.content?.trim();
            if (!content) {
              return;
            }
            switch (ogProperty) {
              case "og:title":
                data.ogTitle = content;
                break;
              case "og:image":
                data.ogImageUrl = content;
                break;
              case "og:image:url":
              case "og:image:secure_url":
                // Fallback to variants only if og:image not already set
                if (!data.ogImageUrl) {
                  data.ogImageUrl = content;
                }
                break;
              case "og:site_name":
                data.ogSiteName = content;
                break;
              case "og:description":
                data.ogDescription = content;
                break;
            }
          }
        }
      },
      ontext: (text) => {
        if (tag === "title") {
          tagText += text;
        }
      },
      onclosetag: (name) => {
        if (name === "title") {
          data.title = tagText.trim();
        }
        if (name === "head") {
          parserStream.end();
          resolve(data);
        }
      },
      onerror: reject,
    });
    Readable.fromWeb(body).pipe(parserStream);
  });
}

export async function getLinkMetadata(url: string, language: string = "en-US,en") {
  try {
    const metadata = await parseDocument(url, language);
    const { title, description, ogTitle, ogDescription, ogSiteName, ogImageUrl } = metadata;
    return {
      title: ogTitle || title,
      description: ogDescription || description,
      siteName: ogSiteName,
      imageUrl: ogImageUrl ? resolveImageUrl(ogImageUrl, url) : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Link metadata: Failed to fetch metadata for ${url}: ${message}`);
    return null;
  }
}

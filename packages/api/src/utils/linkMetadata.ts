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

async function parseDocument(url: string, language: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml",
      "Accept-Language": language,
      "User-Agent": "facebookexternalhit/1.1",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Link metadata: Failed to fetch ${url}: [${response.status}] ${response.statusText}`,
    );
  }

  const body = response.body;
  if (!body) {
    throw new Error(
      `Link metadata: Failed to fetch ${url}: No content returned`,
    );
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
          if (attributes.property?.startsWith("og:")) {
            const content = attributes.content?.trim();
            if (!content) {
              return;
            }
            switch (attributes.property) {
              case "og:title":
                data.ogTitle = content;
                break;
              case "og:image":
                data.ogImageUrl = content;
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
    // @ts-expect-error Type incompatibility between Node and browser ReadableStream interfaces
    Readable.fromWeb(body).pipe(parserStream);
  });
}

export async function getLinkMetadata(
  url: string,
  language: string = "en-US,en",
) {
  try {
    const metadata = await parseDocument(url, language);
    const {
      title,
      description,
      ogTitle,
      ogDescription,
      ogSiteName,
      ogImageUrl,
    } = metadata;
    return {
      title: ogTitle || title,
      description: ogDescription || description,
      siteName: ogSiteName,
      imageUrl: ogImageUrl,
    };
  } catch (error) {
    console.error(
      `Link metadata: Failed to fetch metadata for ${url}: ${error}`,
    );
    return null;
  }
}

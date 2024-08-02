import { IncomingMessage, ServerResponse } from "node:http";
import { getLinkTileImageUrl } from "@/models/tiles/link.ts";

export async function resourcesHandler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  console.log("REQUEST URL", req.url);
  const [, , resourceType, resourceId] = req.url?.split("/", 4) ?? [];

  switch (resourceType) {
    case "links":
      return handleLinkTile(resourceId, res);
    default:
      res.writeHead(404);
      res.end();
      return;
  }
}

async function handleLinkTile(id: string, res: ServerResponse) {
  const imageUrl = await getLinkTileImageUrl(id);
  if (imageUrl) {
    res.writeHead(301, {
      Location: imageUrl,
    });
    res.end();
  } else {
    res.writeHead(404);
    res.end();
  }
}

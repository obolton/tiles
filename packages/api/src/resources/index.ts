import { ServerResponse } from "node:http";
import { z } from "zod";
import { getLinkTileImageUrl } from "@/models/tiles/link.ts";
import { getVideoTileImageUrl } from "@/models/tiles/video.ts";

const ResourceIdSchema = z.string().uuid();

export async function resourcesHandler(
  pathSegments: string[],
  res: ServerResponse,
) {
  const [resourceType, resourceId] = pathSegments;

  switch (resourceType) {
    case "links":
      return handleLinkTile(resourceId, res);
    case "videos":
      return handleVideoTile(resourceId, res);
    default:
      res.writeHead(404);
      res.end();
      return;
  }
}

async function handleLinkTile(id: string, res: ServerResponse) {
  try {
    ResourceIdSchema.parse(id);
  } catch {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
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
  } catch (error) {
    console.log(error);
    res.writeHead(500);
    res.end();
  }
}

async function handleVideoTile(id: string, res: ServerResponse) {
  try {
    ResourceIdSchema.parse(id);
  } catch {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    const imageUrl = await getVideoTileImageUrl(id);
    if (imageUrl) {
      res.writeHead(301, {
        Location: imageUrl,
      });
      res.end();
    } else {
      res.writeHead(404);
      res.end();
    }
  } catch (error) {
    console.log(error);
    res.writeHead(500);
    res.end();
  }
}

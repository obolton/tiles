import { ServerResponse } from "node:http";
import { z } from "zod";
import { getLinkTileImageUrl } from "@/routes/links/links.ts";
import { getVideoTileImageUrl } from "@/routes/videos/videos.ts";

const ResourceIdSchema = z.string().uuid();

export async function resourcesHandler(
  type: string,
  id: string,
  res: ServerResponse,
) {
  switch (type) {
    case "links":
      return handleLinkTile(id, res);
    case "videos":
      return handleVideoTile(id, res);
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

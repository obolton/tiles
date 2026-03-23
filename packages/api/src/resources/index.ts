import { ServerResponse } from "node:http";
import { z } from "zod";
import { getVideoTileOriginalImageUrl } from "@/routes/videos/videos.ts";

const ResourceIdSchema = z.uuid();

export async function resourcesHandler(
  type: string,
  id: string,
  res: ServerResponse,
) {
  switch (type) {
    case "videos":
      return handleVideoTile(id, res);
    default:
      res.writeHead(404);
      res.end();
      return;
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
    const imageUrl = await getVideoTileOriginalImageUrl(id);
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
    console.error(error);
    res.writeHead(500);
    res.end();
  }
}

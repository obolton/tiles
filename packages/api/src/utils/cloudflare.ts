import { env } from "@/env";

const API_BASE_URL = "https://api.cloudflare.com/client/v4";

type PurgeCacheOptions = { files: string[] } | { purgeEverything: true };

export async function purgeCache(options: PurgeCacheOptions) {
  const response = await fetch(`${API_BASE_URL}/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify("files" in options ? options : { purge_everything: true }),
  });
  if (!response.ok) {
    throw new Error(`Cloudflare cache purge failed: ${response.status} ${await response.text()}`);
  }
}

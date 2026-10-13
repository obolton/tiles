import cloudflare, { CLOUDFLARE_ZONE_ID } from "@/utils/cloudflare";

console.log("Purging CDN cache...");
await cloudflare.cache.purge({
  zone_id: CLOUDFLARE_ZONE_ID,
  purge_everything: true,
});
console.log("Purged CDN cache.");

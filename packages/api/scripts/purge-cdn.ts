import { purgeCache } from "@/utils/cloudflare";

console.log("Purging CDN cache...");
await purgeCache({ purge_everything: true });
console.log("Purged CDN cache.");

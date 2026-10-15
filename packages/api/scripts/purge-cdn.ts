import { purgeCache } from "@/utils/cloudflare";

console.log("Purging CDN cache...");
await purgeCache({ purgeEverything: true });
console.log("Purged CDN cache.");

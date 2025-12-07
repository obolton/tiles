import assert from "node:assert";
import { Cloudflare } from "cloudflare";

assert(process.env.CLOUDFLARE_API_TOKEN);
assert(process.env.CLOUDFLARE_ZONE_ID);

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
export const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

const cloudflare = new Cloudflare({
  apiToken: CLOUDFLARE_API_TOKEN,
});

export default cloudflare;

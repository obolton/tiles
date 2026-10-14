import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

// Loopback, private, link-local (including cloud metadata), CGNAT, documentation,
// benchmarking, multicast, reserved and IPv4-embedding IPv6 ranges.
const BLOCKED_IPV4_SUBNETS: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

const BLOCKED_IPV6_SUBNETS: [string, number][] = [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 32],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
];

const BLOCKED_ADDRESSES = new BlockList();
for (const [address, prefix] of BLOCKED_IPV4_SUBNETS) {
  BLOCKED_ADDRESSES.addSubnet(address, prefix, "ipv4");
}
for (const [address, prefix] of BLOCKED_IPV6_SUBNETS) {
  BLOCKED_ADDRESSES.addSubnet(address, prefix, "ipv6");
}

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedUrlError";
  }
}

/**
 * Returns true if the address is not a plain, publicly routable IP.
 * Unparseable addresses are treated as blocked.
 */
export function isBlockedAddress(address: string): boolean {
  const [bareAddress = ""] = address.split("%");
  const family = isIP(bareAddress);
  if (family === 0) {
    return true;
  }
  // BlockList checks IPv4-mapped IPv6 addresses against the IPv4 rules.
  return BLOCKED_ADDRESSES.check(bareAddress, family === 4 ? "ipv4" : "ipv6");
}

function getHostname(url: URL) {
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}

/**
 * Throws unless the URL is an http(s) URL whose host is, or resolves only to,
 * publicly routable addresses.
 */
export async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedUrlError(`Disallowed protocol: ${url.protocol}`);
  }

  const hostname = getHostname(url);
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new BlockedUrlError(`Disallowed host: ${url.hostname}`);
  }

  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new BlockedUrlError(`Disallowed address: ${url.hostname}`);
    }
    return;
  }

  const addresses = await lookup(hostname, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new BlockedUrlError(`Disallowed host: ${url.hostname} resolves to a private address`);
  }
}

export type SafeFetchOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  maxRedirects?: number;
};

/**
 * Fetches a user-supplied URL, rejecting private and internal destinations.
 * Redirects are followed manually so that every hop is validated.
 */
export async function safeFetch(
  input: string,
  { headers, signal, maxRedirects = MAX_REDIRECTS }: SafeFetchOptions = {},
): Promise<Response> {
  let url = new URL(input);
  for (let redirects = 0; ; redirects++) {
    await assertPublicUrl(url);
    const response = await fetch(url.href, { headers, signal, redirect: "manual" });
    const location = response.headers.get("Location");
    if (!REDIRECT_STATUSES.has(response.status) || !location) {
      return response;
    }
    await response.body?.cancel();
    if (redirects >= maxRedirects) {
      throw new Error(`Too many redirects fetching ${input}`);
    }
    url = new URL(location, url);
  }
}

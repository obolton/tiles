import type { Manifest } from "vite";

type RouteManifest = Record<string, string[]>;

let manifest: Manifest | null = null;
let routeManifest: RouteManifest | null = null;

if (import.meta.env.PROD && import.meta.env.SSR) {
  // @ts-ignore File is present in production builds
  manifest = (await import("../../dist/.vite/manifest.json")).default as Manifest;
  // @ts-ignore File is present in production builds
  routeManifest = (await import("../../dist/route-manifest.json")).default as RouteManifest;
}

export function resolveImport(path: string) {
  if (import.meta.env.DEV) {
    return path;
  }

  if (!manifest) {
    throw new Error("Missing manifest");
  }
  const relativePath = path.startsWith("/") ? path.slice(1) : path;
  const chunk = manifest[relativePath];
  if (!chunk) {
    throw new Error(`Cannot resolve chunk for import path: ${path}`);
  }
  return import.meta.env.BASE_URL + chunk.file;
}

export function getStylesheetsForRouteModule(path: string) {
  if (import.meta.env.DEV) {
    return [];
  }

  if (!routeManifest) {
    throw new Error("Missing route manifest");
  }
  const relativePath = path.startsWith("/") ? path.slice(1) : path;
  return routeManifest[relativePath] ?? [];
}

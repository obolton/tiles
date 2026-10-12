import { join } from "node:path";
import { getPlatformProxy } from "wrangler";

export interface FontBucketPutOptions {
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
}

// The subset of the Workers R2Bucket API that the sync needs.
export interface FontBucket {
  head(key: string): Promise<object | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView,
    options?: FontBucketPutOptions,
  ): Promise<unknown>;
}

export interface FontBucketSession {
  bucket: FontBucket;
  dispose(): Promise<void>;
}

const CONFIG_PATH = join(import.meta.dirname, "../wrangler.jsonc");
const STATE_PATH = join(import.meta.dirname, "../../../.wrangler/state/v3");

export async function openFontBucket(environment?: string): Promise<FontBucketSession> {
  const proxy = await getPlatformProxy<{ FONTS: FontBucket }>({
    configPath: CONFIG_PATH,
    persist: { path: STATE_PATH },
    environment,
  });

  return {
    bucket: proxy.env.FONTS,
    dispose: () => proxy.dispose(),
  };
}

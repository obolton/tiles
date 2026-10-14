import { safeFetch } from "@/utils/safeFetch";

export type ContentType = `${string}/${string}`;

const FETCH_TIMEOUT_MS = 10000;

export async function getStream<T extends readonly ContentType[]>(
  url: string,
  acceptContentTypes: T,
) {
  const response = await safeFetch(url, {
    headers: {
      Accept: acceptContentTypes.join(", "),
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`getStream: ${response.status}: ${response.statusText}`);
  }
  const contentType = (response.headers.get("Content-Type")?.toLowerCase() ?? "") as T[number];
  if (!contentType) {
    throw new Error(`getStream: No Content-Type header.`);
  }
  if (!acceptContentTypes.includes(contentType)) {
    throw new Error(`getStream: Invalid Content-Type header: ${contentType}.`);
  }
  if (!response.body) {
    throw new Error("getStream: No response body.");
  }
  return { stream: response.body, contentType };
}

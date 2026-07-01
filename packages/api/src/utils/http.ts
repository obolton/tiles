export type ContentType = `${string}/${string}`;

export async function getStream<T extends readonly ContentType[]>(
  url: string,
  acceptContentTypes: T,
) {
  const response = await fetch(url, {
    headers: {
      Accept: acceptContentTypes.join(", "),
    },
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

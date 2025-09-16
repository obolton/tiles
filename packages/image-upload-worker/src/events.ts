// https://developers.cloudflare.com/r2/buckets/event-notifications/#properties
export interface R2EventMessage {
  account: string;
  action:
    | "PutObject"
    | "CopyObject"
    | "CompleteMultipartUpload"
    | "DeleteObject";
  bucket: string;
  object: {
    key: string;
    size?: number;
    eTag?: string;
  };
  eventTime: string;
}

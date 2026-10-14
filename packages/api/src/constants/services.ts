export enum ServiceName {
  WEB = "web",
  IMAGE_UPLOAD_WORKER = "image-upload-worker",
}

export function isServiceName(value: string): value is ServiceName {
  return Object.values(ServiceName).some((name) => name === value);
}

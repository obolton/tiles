export const SERVICE_NAMES = ["web", "image-upload-worker"] as const;

export type ServiceName = (typeof SERVICE_NAMES)[number];

export function isServiceName(value: string): value is ServiceName {
  return SERVICE_NAMES.some((name) => name === value);
}

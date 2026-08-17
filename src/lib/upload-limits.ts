export const COVER_MAX_BYTES = 2 * 1024 * 1024;
export const FILE_MAX_BYTES = 20 * 1024 * 1024;

export function formatMaxSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

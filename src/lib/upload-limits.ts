export const COVER_MAX_BYTES = 25 * 1024 * 1024;
export const FILE_MAX_BYTES = 150 * 1024 * 1024;
export const CHUNK_SIZE_BYTES = 2 * 1024 * 1024;
export const CHUNK_MAX_BYTES = 4 * 1024 * 1024;

export function formatMaxSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

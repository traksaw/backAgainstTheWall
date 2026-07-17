// lib/video.ts

// WAS-42: the upload script content-hashes the video and writes a new URL
// per upload (scripts/video-versioning.mjs); this default is only a
// fallback for environments where NEXT_PUBLIC_VIDEO_URL isn't set.
export const DEFAULT_VIDEO_URL =
  "https://tkoohwnrcxpmkerj.public.blob.vercel-storage.com/Ambitious_compatible.mp4"

export function getVideoSrc(envValue: string | undefined): string {
  return envValue || DEFAULT_VIDEO_URL
}

import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { buildVersionedFilename, hashBuffer } from './video-versioning.mjs';

const filePath = path.join(process.cwd(), 'public/videos/Ambitious_compatible.mp4');
const baseFilename = 'Ambitious_compatible.mp4';

// Uploads straight to Vercel Blob via the SDK (not through a Next.js API
// route). A route's serverless function body is capped at 4.5MB on Vercel -
// this video is ~240MB, well over that, so a server-upload endpoint could
// never carry it in production regardless of how it's implemented.
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN must be set (see README).');
}

async function uploadVideo() {
  // WAS-42: filename carries a content hash so a re-upload gets a new URL
  // instead of overwriting the previous one in place - the previous
  // addRandomSuffix:false + fixed-name setup meant already-visited clients
  // could keep serving stale bytes from cache for up to a year.
  const fileBuffer = await readFile(filePath);
  const hash = hashBuffer(fileBuffer);
  const filename = buildVersionedFilename(baseFilename, hash);

  console.log(`Uploading ${filename}...`);

  const blob = await put(filename, createReadStream(filePath), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: true,
    // Currently matches put()'s own default (1yr) - set explicitly so the
    // cache lifetime stays pinned even if that default ever changes. Safe
    // to be this long only because the hashed filename above guarantees a
    // new URL per re-upload.
    cacheControlMaxAge: 31536000,
  });

  console.log('File uploaded successfully!');
  console.log('Blob details:', blob);
  console.log('Public URL:', blob.url);
  console.log('\nNEXT_PUBLIC_VIDEO_URL is inlined at build time, not read at runtime:');
  console.log('1. Update NEXT_PUBLIC_VIDEO_URL to this URL in Vercel (and .env.local for dev).');
  console.log('2. Trigger a new deployment - changing the env var alone will NOT update the live site.');
}

uploadVideo().catch(err => {
  console.error('Upload failed:', err);
});

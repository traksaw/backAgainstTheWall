import { createReadStream } from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

const filePath = path.join(process.cwd(), 'public/videos/Ambitious_compatible.mp4');
const filename = 'Ambitious_compatible.mp4';

// Uploads straight to Vercel Blob via the SDK (not through a Next.js API
// route). A route's serverless function body is capped at 4.5MB on Vercel -
// this video is ~240MB, well over that, so a server-upload endpoint could
// never carry it in production regardless of how it's implemented.
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN must be set (see README).');
}

async function uploadVideo() {
  console.log(`Uploading ${filename}...`);

  const blob = await put(filename, createReadStream(filePath), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: true,
  });

  console.log('File uploaded successfully!');
  console.log('Blob details:', blob);
  console.log('Public URL:', blob.url);
}

uploadVideo().catch(err => {
  console.error('Upload failed:', err);
});

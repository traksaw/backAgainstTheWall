import { readFileSync } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public/videos/Ambitious_compatible.mp4');
const file = readFileSync(filePath);
const filename = 'Ambitious_compatible.mp4';

// Make sure to set your VERCEL_PROJECT_ID and VERCEL_API_TOKEN environment variables
// Or run `vercel login` and `vercel link` first.
//
// UPLOAD_TARGET_URL overrides which deployment to upload against (e.g. a
// preview URL) and takes precedence over the NODE_ENV-based default below.
const PRODUCTION_URL = 'https://backagainstthewall.vercel.app';
const BASE_URL =
  process.env.UPLOAD_TARGET_URL ??
  (process.env.NODE_ENV === 'production' ? PRODUCTION_URL : 'http://localhost:3000');
const UPLOAD_URL = `${BASE_URL}/api/upload`;

async function uploadVideo() {
  console.log(`Uploading ${filename}...`);

  const response = await fetch(`${UPLOAD_URL}?filename=${filename}`, {
    method: 'POST',
    body: file,
  });

  const newBlob = await response.json();

  console.log('File uploaded successfully!');
  console.log('Blob details:', newBlob);
  console.log('Public URL:', newBlob.url);
}

uploadVideo().catch(err => {
  console.error('Upload failed:', err);
});

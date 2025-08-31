import { readFileSync } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public/videos/Ambitious_compatible.mp4');
const file = readFileSync(filePath);
const filename = 'Ambitious_compatible.mp4';

// Make sure to set your VERCEL_PROJECT_ID and VERCEL_API_TOKEN environment variables
// Or run `vercel login` and `vercel link` first.
const UPLOAD_URL = process.env.NODE_ENV === 'production' 
  ? 'https://back-against-the-wall-git-last-36d7bb-waskar-paulinos-projects.vercel.app/api/upload'
  : 'http://localhost:3000/api/upload';

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

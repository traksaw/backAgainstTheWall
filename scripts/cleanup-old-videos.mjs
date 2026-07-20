import { del, list } from '@vercel/blob';
import { selectBlobsToDelete } from './video-versioning.mjs';

const baseFilename = 'Ambitious_compatible.mp4';
const keepUrl = process.env.NEXT_PUBLIC_VIDEO_URL;
const confirmed = process.argv.includes('--confirm');

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN must be set (see README).');
}

if (!keepUrl) {
  throw new Error(
    'NEXT_PUBLIC_VIDEO_URL must be set to the URL the live deployment currently ' +
      'serves - that is what this script keeps. Confirm the latest upload has actually ' +
      'been deployed before running this, or you will delete the version production is ' +
      'still serving.'
  );
}

async function cleanupOldVideos() {
  const { blobs } = await list();
  const toDelete = selectBlobsToDelete(blobs, keepUrl, baseFilename);

  if (toDelete.length === 0) {
    console.log('Nothing to clean up - no old versions found.');
    return;
  }

  console.log(`Keeping: ${keepUrl}`);
  console.log(`Found ${toDelete.length} old version(s):`);
  toDelete.forEach((blob) => console.log(`  ${blob.pathname}`));

  if (!confirmed) {
    console.log('\nDry run - nothing deleted. Re-run with --confirm to delete these.');
    return;
  }

  await del(toDelete.map((blob) => blob.url));
  console.log(`\nDeleted ${toDelete.length} old version(s).`);
}

cleanupOldVideos().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exitCode = 1;
});

import 'server-only';
import { createClient } from '@sanity/client';
import {
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  SANITY_API_VERSION,
  SANITY_TOKEN,
} from './env';

if (!SANITY_PROJECT_ID) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
if (!SANITY_DATASET) throw new Error('Missing NEXT_PUBLIC_SANITY_DATASET');

export const serverClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  // WAS-43: useCdn: false already bypasses Sanity's CDN cache on every fetch,
  // and the homepage that reads this data is forced into per-request dynamic
  // rendering by the CSP nonce work in app/layout.tsx (WAS-33) - there's no
  // static/ISR cache layer left for a revalidate webhook to invalidate. That's
  // why no revalidate route or SANITY_REVALIDATE_SECRET exists; re-introduce
  // only if a page here opts into `revalidate`/`force-static` later.
  useCdn: false,
  token: SANITY_TOKEN, // stays on server
});

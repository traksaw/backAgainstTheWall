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
  useCdn: false,
  token: SANITY_TOKEN, // stays on server
});

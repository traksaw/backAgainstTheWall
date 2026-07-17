'use client';

import { createClient } from '@sanity/client';
import { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION } from './env';
import { logger } from '@/lib/logger';

if (!SANITY_PROJECT_ID) logger.warn('Sanity projectId missing in client');

export const clientClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true,
  // NO token here—ever.
});

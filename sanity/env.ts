// Shared, safe accessors
export const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
export const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-08-01';

// Server-only (do not prefix with NEXT_PUBLIC)
export const SANITY_TOKEN = process.env.SANITY_API_READ_TOKEN;

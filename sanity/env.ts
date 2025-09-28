// Shared, safe accessors with hardcoded fallbacks
export const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'u6u93i77';
export const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const SANITY_API_VERSION = '2023-05-03';

// Server-only (do not prefix with NEXT_PUBLIC)
export const SANITY_TOKEN = process.env.SANITY_API_READ_TOKEN;

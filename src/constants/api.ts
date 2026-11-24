const configuredApiUrl =
  process.env.EXPO_PUBLIC_API_URL || 'https://scrapgo-backend.onrender.com';

export const API_URL = configuredApiUrl.replace(/\/$/, '');
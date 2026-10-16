import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';

export interface PlacePhoto {
  url: string;
  authors: { displayName: string; uri?: string }[];
}

async function googleJson(url: string, headers: Record<string, string>) {
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({
      url, headers, responseType: 'json', connectTimeout: 12000, readTimeout: 12000,
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Google Photos HTTP ${response.status}`);
    }
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  }
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Google Photos HTTP ${response.status}`);
  return response.json();
}

/** Fresh photo references and image URLs; never save these in localStorage. */
export async function fetchRestaurantPhoto(placeId: string): Promise<PlacePhoto | null> {
  if (!placeId || placeId.startsWith('google_place_')) return null;
  const headers = { 'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY };
  const details = await googleJson(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    { ...headers, 'X-Goog-FieldMask': 'photos' },
  );
  const photos = details.photos || [];
  for (const photo of photos.slice(0, 3)) {
    if (!photo.name?.startsWith(`places/${placeId}/photos/`)) continue;
    try {
      const media = await googleJson(
        `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`,
        headers,
      );
      if (typeof media.photoUri === 'string' && media.photoUri.startsWith('https://')) {
        return { url: media.photoUri, authors: photo.authorAttributions || [] };
      }
    } catch {
      // A single expired or unavailable photo must not hide the remaining photos.
    }
  }
  if (photos.length) throw new Error('No se pudo obtener la fotografía de Google');
  return null;
}

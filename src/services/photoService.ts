import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';

export interface PlacePhoto {
  url: string;
  authors: { displayName: string; uri?: string }[];
}

function requestError(stage: string, status?: number): Error {
  return new Error(status ? `${stage}: Google respondió ${status}` : `${stage}: error de conexión`);
}

async function nativeImage(url: string): Promise<string> {
  let response;
  try {
    response = await CapacitorHttp.get({
      url, responseType: 'arraybuffer', connectTimeout: 12000, readTimeout: 12000,
    });
  } catch { throw requestError('Descarga de la imagen'); }
  if (response.status < 200 || response.status >= 300) {
    throw requestError('Descarga de la imagen', response.status);
  }
  const contentType = Object.entries(response.headers).find(([key]) => key.toLowerCase() === 'content-type')?.[1]?.split(';')[0];
  if ((contentType && !contentType.startsWith('image/')) || typeof response.data !== 'string' || !response.data) {
    throw new Error('Google no devolvió una imagen válida');
  }
  return `data:${contentType || 'image/jpeg'};base64,${response.data.replace(/\s/g, '')}`;
}

async function googleJson(url: string, headers: Record<string, string>, stage: string) {
  try {
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({
      url, headers, responseType: 'json', connectTimeout: 12000, readTimeout: 12000,
    });
    if (response.status < 200 || response.status >= 300) {
      throw requestError(stage, response.status);
    }
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  }
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw requestError(stage, response.status);
  return response.json();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(`${stage}:`)) throw error;
    throw requestError(stage);
  }
}

/** Fresh photo references and image URLs; never save these in localStorage. */
export async function fetchRestaurantPhoto(placeId: string): Promise<PlacePhoto | null> {
  if (!placeId || placeId.startsWith('google_place_')) return null;
  const headers = { 'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY };
  const details = await googleJson(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    { ...headers, 'X-Goog-FieldMask': 'photos' },
    'Consulta de fotos',
  );
  const photos = details.photos || [];
  let lastError: unknown;
  for (const photo of photos.slice(0, 3)) {
    if (!photo.name?.startsWith(`places/${placeId}/photos/`)) continue;
    try {
      const media = await googleJson(
        `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`,
        headers,
        'Enlace de la foto',
      );
      if (typeof media.photoUri === 'string' && media.photoUri.startsWith('https://')) {
        // The native HTTP plugin may omit Content-Type or fail on Google's image CDN.
        // In that case, let the Android WebView load the genuine photo URL directly.
        let url = media.photoUri;
        if (Capacitor.isNativePlatform()) {
          try { url = await nativeImage(media.photoUri); }
          catch (imageError) {
            console.warn('Native image download failed; using Google photo URL', imageError);
          }
        }
        return { url, authors: photo.authorAttributions || [] };
      }
    } catch (error) {
      lastError = error;
      // A single expired or unavailable photo must not hide the remaining photos.
    }
  }
  if (photos.length) throw lastError || new Error('Google no devolvió un enlace de foto válido');
  return null;
}

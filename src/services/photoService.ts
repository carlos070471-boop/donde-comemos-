import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';

export interface PlacePhoto {
  url: string;
  authors: { displayName: string; uri?: string }[];
}

async function googleJson(url: string, headers: Record<string, string>, stage: string) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`${stage}: Google respondió ${response.status}`);
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(`${stage}:`)) throw error;
    throw new Error(`${stage}: error de conexión`);
  }
}

/**
 * Obtiene una URL temporal y directa de la fotografía de Google Places.
 * Pedimos skipHttpRedirect=true para que Google nos devuelva photoUri en JSON.
 * Así el WebView Android carga la URL final de la imagen y no tiene que seguir
 * el endpoint /media con la clave API dentro de una etiqueta <img>.
 */
export async function fetchRestaurantPhoto(placeId: string): Promise<PlacePhoto | null> {
  if (!placeId || placeId.startsWith('google_place_')) return null;

  const headers = { 'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY };
  const details = await googleJson(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    { ...headers, 'X-Goog-FieldMask': 'photos' },
    'Consulta de fotos',
  );

  const photos = Array.isArray(details.photos) ? details.photos : [];
  const photo = photos.find((item: any) => typeof item?.name === 'string');
  if (!photo) return null;

  const media = await googleJson(
    `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`,
    headers,
    'Descarga de foto',
  );

  if (!media?.photoUri || typeof media.photoUri !== 'string') return null;

  return {
    url: media.photoUri,
    authors: Array.isArray(photo.authorAttributions) ? photo.authorAttributions : [],
  };
}

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
 * Obtiene una referencia de foto fresca de Google Places.
 * La imagen se entrega directamente desde el endpoint media de Places.
 * Evitamos convertir la imagen a base64 en Android, que era la causa de
 * que WebView terminase mostrando "Fotografía no disponible".
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
  const photo = photos.find((item: any) =>
    typeof item?.name === 'string' && item.name.startsWith(`places/${placeId}/photos/`)
  );

  if (!photo) return null;

  // Con skipHttpRedirect=false Google devuelve la imagen real. La clave se
  // envía como query param porque una etiqueta <img> no puede añadir headers.
  const url = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=false&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;

  return {
    url,
    authors: Array.isArray(photo.authorAttributions) ? photo.authorAttributions : [],
  };
}

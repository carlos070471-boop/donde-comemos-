import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';

export interface PlacePhoto {
  url: string;
  authors: { displayName: string; uri?: string }[];
}

interface RestaurantPhotoInput {
  id: string;
  name: string;
  location?: { lat: number; lng: number };
}

async function googleJson(
  url: string,
  headers: Record<string, string>,
  stage: string,
  method: 'GET' | 'POST' = 'GET',
  data?: unknown,
) {
  try {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.request({
        method,
        url,
        headers,
        data,
        connectTimeout: 12000,
        readTimeout: 12000,
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`${stage}: Google respondió ${response.status}`);
      }
      return response.data;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`${stage}: Google respondió ${response.status}`);
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(`${stage}:`)) throw error;
    throw new Error(`${stage}: error de conexión`);
  }
}

async function resolveGooglePlace(restaurant: RestaurantPhotoInput): Promise<any | null> {
  const headers = {
    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
    'X-Goog-FieldMask': 'places.id,places.photos',
    'Content-Type': 'application/json',
  };

  const body: any = {
    textQuery: restaurant.name,
    languageCode: 'es',
    maxResultCount: 1,
  };

  if (restaurant.location) {
    body.locationBias = {
      circle: {
        center: {
          latitude: restaurant.location.lat,
          longitude: restaurant.location.lng,
        },
        radius: 800,
      },
    };
  }

  const result = await googleJson(
    'https://places.googleapis.com/v1/places:searchText',
    headers,
    'Búsqueda del local',
    'POST',
    body,
  );

  return Array.isArray(result?.places) ? result.places[0] ?? null : null;
}

export async function fetchRestaurantPhoto(restaurant: RestaurantPhotoInput): Promise<PlacePhoto | null> {
  if (!restaurant?.name) return null;

  const apiHeaders = { 'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY };
  let photos: any[] = [];

  // Los restaurantes de la app proceden de OpenStreetMap y sus IDs son
  // osm_node_..., osm_way_..., etc. Esos IDs NO son IDs de Google Places.
  // Primero resolvemos el local por nombre + posición y obtenemos su foto.
  if (restaurant.id?.startsWith('osm_') || restaurant.id?.startsWith('google_place_')) {
    const place = await resolveGooglePlace(restaurant);
    photos = Array.isArray(place?.photos) ? place.photos : [];
  } else if (restaurant.id) {
    const details = await googleJson(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(restaurant.id)}`,
      { ...apiHeaders, 'X-Goog-FieldMask': 'photos' },
      'Consulta de fotos',
    );
    photos = Array.isArray(details?.photos) ? details.photos : [];
  }

  const photo = photos.find((item: any) => typeof item?.name === 'string');
  if (!photo) return null;

  const media = await googleJson(
    `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`,
    apiHeaders,
    'Descarga de foto',
  );

  if (!media?.photoUri || typeof media.photoUri !== 'string') return null;

  return {
    url: media.photoUri,
    authors: Array.isArray(photo.authorAttributions) ? photo.authorAttributions : [],
  };
}

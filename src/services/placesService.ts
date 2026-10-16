import { Coordinates, Restaurant } from '../types/restaurant';
import { calculateDistance } from '../utils/distance';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
];

function addressFromTags(tags: Record<string, string>): string {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  return [street, tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(', ') || 'Dirección no disponible';
}

function websiteFromTags(tags: Record<string, string>): string | undefined {
  return tags.website || tags['contact:website'];
}

function photoFromTags(tags: Record<string, string>): string | undefined {
  const direct = tags.image;
  if (direct && /^https?:\/\//i.test(direct)) return direct;

  const commons = tags.wikimedia_commons;
  if (commons) {
    const title = commons.replace(/^File:/i, '').trim();
    if (title) {
      return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(title)}?width=800`;
    }
  }
  return undefined;
}

async function queryOverpass(endpoint: string, query: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Overpass ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Busca restaurantes con OpenStreetMap/Overpass, sin API de pago.
 * Las fotos solo se muestran cuando OSM aporta una URL real o una imagen de Wikimedia Commons.
 */
export async function fetchNearbyRestaurants(
  center: Coordinates,
  radiusMeters: number = 2500
): Promise<{ restaurants: Restaurant[]; source: 'google' | 'fallback' }> {
  const radius = Math.min(Math.max(Math.round(radiusMeters), 200), 10000);
  const query = `[out:json][timeout:10];(nwr(around:${radius},${center.lat},${center.lng})[amenity~"restaurant|cafe|fast_food|bar|pub"];);out center tags;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const data = await queryOverpass(endpoint, query);
      const elements = Array.isArray(data?.elements) ? data.elements : [];
      const restaurants: Restaurant[] = elements
        .map((element: any): Restaurant | null => {
          const tags: Record<string, string> = element.tags || {};
          const lat = element.lat ?? element.center?.lat;
          const lng = element.lon ?? element.center?.lon;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;

          const location = { lat, lng };
          const amenity = tags.amenity || 'restaurant';
          const cuisine = tags.cuisine?.split(';').filter(Boolean) || [];
          return {
            id: `osm_${element.type}_${element.id}`,
            name: tags.name || tags.brand || 'Restaurante sin nombre',
            address: addressFromTags(tags),
            location,
            distanceMeters: calculateDistance(center, location),
            phoneNumber: tags.phone || tags['contact:phone'],
            websiteUri: websiteFromTags(tags),
            photoUrl: photoFromTags(tags),
            types: [amenity, ...cuisine],
            primaryType: amenity === 'cafe' ? 'Cafetería' : amenity === 'bar' || amenity === 'pub' ? 'Bar' : amenity === 'fast_food' ? 'Comida rápida' : 'Restaurante',
            openingHoursSummary: tags.opening_hours,
          };
        })
        .filter((item: Restaurant | null): item is Restaurant => item !== null && item.name !== 'Restaurante sin nombre')
        .sort((a: Restaurant, b: Restaurant) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));

      if (restaurants.length) return { restaurants, source: 'fallback' };
    } catch (error) {
      console.warn('Fallo Overpass, probando otro servidor:', endpoint, error);
    }
  }

  return { restaurants: [], source: 'fallback' };
}

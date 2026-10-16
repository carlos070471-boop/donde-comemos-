import { Coordinates, Restaurant } from '../types/restaurant';
import { calculateDistance } from '../utils/distance';

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
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
    if (title) return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(title)}?width=800`;
  }
  return undefined;
}

async function queryOverpass(endpoint: string, query: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const url = `${endpoint}?data=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Overpass ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function mapElements(data: any, center: Coordinates): Restaurant[] {
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const seen = new Set<string>();
  return elements
    .map((element: any): Restaurant | null => {
      const tags: Record<string, string> = element.tags || {};
      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      const name = tags.name || tags.brand;
      if (!name) return null;
      const key = `${name.toLowerCase()}_${lat.toFixed(5)}_${lng.toFixed(5)}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const location = { lat, lng };
      const amenity = tags.amenity || tags.shop || 'restaurant';
      const cuisine = tags.cuisine?.split(';').filter(Boolean) || [];
      return {
        id: `osm_${element.type}_${element.id}`,
        name,
        address: addressFromTags(tags),
        location,
        distanceMeters: calculateDistance(center, location),
        phoneNumber: tags.phone || tags['contact:phone'],
        websiteUri: websiteFromTags(tags),
        photoUrl: photoFromTags(tags),
        types: [amenity, ...cuisine],
        primaryType: amenity === 'cafe' ? 'Cafetería' : amenity === 'bar' || amenity === 'pub' ? 'Bar' : amenity === 'fast_food' ? 'Comida rápida' : amenity === 'bakery' ? 'Panadería' : 'Restaurante',
        openingHoursSummary: tags.opening_hours,
      };
    })
    .filter((item: Restaurant | null): item is Restaurant => item !== null)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
}

/** Busca locales de comida cercanos con OpenStreetMap/Overpass, sin API de pago. */
export async function fetchNearbyRestaurants(
  center: Coordinates,
  radiusMeters: number = 2500
): Promise<{ restaurants: Restaurant[]; source: 'google' | 'fallback' }> {
  const requestedRadius = Math.min(Math.max(Math.round(radiusMeters), 500), 10000);
  // Si una zona tiene pocos datos OSM, hacemos un segundo intento algo más amplio,
  // pero App.tsx seguirá filtrando y mostrando solo los que estén dentro del radio elegido.
  const searchRadii = Array.from(new Set([requestedRadius, Math.min(Math.max(requestedRadius * 2, 5000), 10000)]));

  for (const radius of searchRadii) {
    const query = `[out:json][timeout:15];(nwr(around:${radius},${center.lat},${center.lng})[amenity~"^(restaurant|cafe|fast_food|bar|pub|food_court)$"];nwr(around:${radius},${center.lat},${center.lng})[shop="bakery"];);out center tags;`;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const data = await queryOverpass(endpoint, query);
        const restaurants = mapElements(data, center);
        if (restaurants.length > 0) return { restaurants, source: 'fallback' };
      } catch (error) {
        console.warn('Fallo Overpass, probando otro servidor:', endpoint, error);
      }
    }
  }

  return { restaurants: [], source: 'fallback' };
}

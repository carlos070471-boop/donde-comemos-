import { Coordinates, Restaurant } from '../types/restaurant';
import { calculateDistance } from '../utils/distance';

const OVERPASS_ENDPOINTS = [
  'https://overpass.nchc.org.tw/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

function addressFromTags(tags: Record<string, string>): string {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  return [street, tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(', ') || 'Dirección no disponible';
}

function websiteFromTags(tags: Record<string, string>): string | undefined {
  return tags.website || tags['contact:website'];
}

/** Only use explicitly linked photographs of this venue, never generic search images. */
function photoFromTags(tags: Record<string, string>): string | undefined {
  const candidates = [tags.image, tags['contact:image'], tags.wikimedia_commons];
  for (const raw of candidates) {
    if (!raw) continue;
    const value = raw.trim();
    if (/^https:\/\//i.test(value)) return value;
    // OSM supports Wikimedia Commons File: titles as well as direct URLs.
    // Category: pages are not photographs and must not be used as images.
    if (/^(?:File|Image):/i.test(value)) {
      const filename = value.replace(/^(?:File|Image):/i, '').trim().replace(/ /g, '_');
      if (filename) return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}?width=800`;
    }
  }
  return undefined;
}

async function queryOverpass(endpoint: string, query: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
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

async function firstUsefulResult(query: string, center: Coordinates): Promise<Restaurant[]> {
  // Try one public endpoint at a time to avoid multiplying server load.
  // A successful empty response is valid; do not misreport it as an outage.
  const errors: string[] = [];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const data = await queryOverpass(endpoint, query);
      if (!Array.isArray(data?.elements)) throw new Error('Respuesta sin elementos');
      return mapElements(data, center);
    } catch (error) {
      errors.push(`${endpoint}: ${String(error)}`);
      console.warn('Servidor Overpass no disponible:', endpoint, error);
    }
  }
  console.warn('Todos los servidores Overpass fallaron:', errors.join('; '));
  throw new Error('No se pudo conectar con los servidores gratuitos de restaurantes. Inténtalo de nuevo más tarde.');
}

/** Busca locales cercanos con OpenStreetMap/Overpass sin API de pago. */
export async function fetchNearbyRestaurants(
  center: Coordinates,
  radiusMeters: number = 2500
): Promise<{ restaurants: Restaurant[]; source: 'google' | 'fallback' }> {
  const radius = Math.min(Math.max(Math.round(radiusMeters), 500), 10000);
  const query = `[out:json][timeout:15];(nwr(around:${radius},${center.lat},${center.lng})[amenity~"^(restaurant|cafe|fast_food|bar|pub|food_court)$"];nwr(around:${radius},${center.lat},${center.lng})[shop="bakery"];);out center tags;`;

  try {
    const restaurants = await firstUsefulResult(query, center);
    // Keep known restaurant photos when the search radius changes.
    try {
      const cached = JSON.parse(localStorage.getItem('donde_comemos_last_restaurants') || 'null');
      const photos = new Map<string, string>(
        (cached?.restaurants || []).filter((r: Restaurant) => r.photoUrl)
          .map((r: Restaurant) => [r.id, r.photoUrl as string])
      );
      restaurants.forEach(r => { if (!r.photoUrl) r.photoUrl = photos.get(r.id); });
    } catch { /* storage unavailable */ }
    try { localStorage.setItem('donde_comemos_last_restaurants', JSON.stringify({ center, restaurants, savedAt: Date.now() })); } catch { /* storage unavailable */ }
    return { restaurants, source: 'fallback' };
  } catch (error) {
    try {
      const cached = JSON.parse(localStorage.getItem('donde_comemos_last_restaurants') || 'null');
      if (cached?.restaurants?.length && calculateDistance(center, cached.center) < 10000) {
        return { restaurants: cached.restaurants.map((r: Restaurant) => ({ ...r, distanceMeters: calculateDistance(center, r.location) })), source: 'fallback' };
      }
    } catch { /* storage unavailable */ }
    throw error;
  }
}

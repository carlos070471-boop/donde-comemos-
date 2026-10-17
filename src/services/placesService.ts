import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Coordinates, Restaurant } from '../types/restaurant';
import { calculateDistance } from '../utils/distance';

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const CACHE_KEY = 'donde_comemos_last_restaurants';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12000;
const TOTAL_TIMEOUT_MS = 18000;

function addressFromTags(tags: Record<string, string>): string {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  return [street, tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(', ') || 'Dirección no disponible';
}
function websiteFromTags(tags: Record<string, string>): string | undefined { return tags.website || tags['contact:website']; }
function normalizePhoto(value?: string): string | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^Category:/i.test(raw)) return undefined;
  const title = raw.replace(/^File:/i, '').trim();
  return title ? `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(title)}?width=1200` : undefined;
}
function photosFromTags(tags: Record<string, string>): string[] {
  return [...new Set([tags.image, tags.wikimedia_commons].flatMap(v => v ? v.split(';') : []).map(normalizePhoto).filter((u): u is string => Boolean(u)))];
}
function timeoutPromise(ms: number): Promise<never> { return new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms)); }

async function queryOverpass(endpoint: string, query: string): Promise<any> {
  if (Capacitor.isNativePlatform()) {
    // Native GET + params lets Capacitor encode the Overpass query itself.
    // This avoids the form-body encoding issue that caused Android requests to fail.
    const nativeRequest = CapacitorHttp.get({
      url: endpoint,
      params: { data: query },
      headers: { Accept: 'application/json' },
      connectTimeout: 8000,
      readTimeout: REQUEST_TIMEOUT_MS,
    });
    const response = await Promise.race([nativeRequest, timeoutPromise(REQUEST_TIMEOUT_MS)]);
    if (response.status < 200 || response.status >= 300) throw new Error(`Overpass ${response.status}`);
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    if (!data || !Array.isArray(data.elements)) throw new Error('Respuesta Overpass no válida');
    return data;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const url = `${endpoint}?data=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`Overpass ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timeout); }
}

function mapElements(data: any, center: Coordinates): Restaurant[] {
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const seen = new Set<string>();
  return elements.map((element: any): Restaurant | null => {
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
    const photoUrls = photosFromTags(tags);
    return { id: `osm_${element.type}_${element.id}`, name, address: addressFromTags(tags), location,
      distanceMeters: calculateDistance(center, location), phoneNumber: tags.phone || tags['contact:phone'],
      websiteUri: websiteFromTags(tags), photoUrl: photoUrls[0], photoUrls, types: [amenity, ...cuisine],
      primaryType: amenity === 'cafe' ? 'Cafetería' : amenity === 'bar' || amenity === 'pub' ? 'Bar' : amenity === 'fast_food' ? 'Comida rápida' : amenity === 'bakery' ? 'Panadería' : 'Restaurante',
      openingHoursSummary: tags.opening_hours };
  }).filter((item: Restaurant | null): item is Restaurant => item !== null).sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
}

async function firstUsefulResult(query: string, center: Coordinates): Promise<Restaurant[]> {
  const attempts = OVERPASS_ENDPOINTS.map(async endpoint => {
    const data = await queryOverpass(endpoint, query);
    const restaurants = mapElements(data, center);
    if (!restaurants.length) throw new Error('Sin resultados');
    return restaurants;
  });
  try { return await Promise.race([Promise.any(attempts), timeoutPromise(TOTAL_TIMEOUT_MS)]); }
  catch (error) {
    console.warn('Servidores Overpass no disponibles:', error);
    throw new Error('No se pudo conectar con los servidores gratuitos de restaurantes. Comprueba tu conexión e inténtalo de nuevo.');
  }
}

export async function fetchNearbyRestaurants(center: Coordinates, radiusMeters: number = 2500): Promise<{ restaurants: Restaurant[]; source: 'google' | 'fallback' }> {
  const radius = Math.min(Math.max(Math.round(radiusMeters), 500), 10000);
  const query = `[out:json][timeout:12];(nwr(around:${radius},${center.lat},${center.lng})[amenity~"^(restaurant|cafe|fast_food|bar|pub|food_court)$"];nwr(around:${radius},${center.lat},${center.lng})[shop="bakery"];);out center tags;`;
  try {
    const restaurants = await firstUsefulResult(query, center);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ center, restaurants, savedAt: Date.now() })); } catch {}
    return { restaurants, source: 'fallback' };
  } catch (error) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      const age = Date.now() - Number(cached?.savedAt || 0);
      if (cached?.restaurants?.length && age <= CACHE_MAX_AGE_MS && calculateDistance(center, cached.center) < 10000) {
        return { restaurants: cached.restaurants.map((r: Restaurant) => ({ ...r, distanceMeters: calculateDistance(center, r.location) })), source: 'fallback' };
      }
    } catch {}
    throw error;
  }
}

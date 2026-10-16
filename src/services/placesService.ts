import { Coordinates, Restaurant } from '../types/restaurant';
import { calculateDistance } from '../utils/distance';

/**
 * Busca restaurantes reales mediante Google Places.
 * La foto se obtiene desde el mismo SDK de Google Maps que ya usa la app.
 * Esto evita la llamada REST separada que fallaba dentro del WebView Android.
 */
export async function fetchNearbyRestaurants(
  center: Coordinates,
  radiusMeters: number = 2500
): Promise<{ restaurants: Restaurant[]; source: 'google' | 'fallback' }> {
  try {
    if (typeof window === 'undefined' || !(window as any).google?.maps?.importLibrary) {
      console.error('Google Maps no está disponible');
      return { restaurants: [], source: 'fallback' };
    }

    const placesLib = await (window as any).google.maps.importLibrary('places');
    if (!placesLib?.Place?.searchNearby) {
      console.error('Google Places no está disponible');
      return { restaurants: [], source: 'fallback' };
    }

    const request = {
      fields: [
        'id', 'displayName', 'formattedAddress', 'location', 'rating',
        'userRatingCount', 'priceLevel', 'currentOpeningHours',
        'nationalPhoneNumber', 'websiteURI', 'types', 'primaryType',
        'primaryTypeDisplayName', 'photos',
      ],
      locationRestriction: {
        center: { lat: center.lat, lng: center.lng },
        radius: Math.min(Math.max(radiusMeters, 1), 50000),
      },
      includedPrimaryTypes: [
        'restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway',
        'fast_food_restaurant', 'pizza_restaurant', 'seafood_restaurant',
        'mediterranean_restaurant', 'spanish_restaurant', 'mexican_restaurant',
        'italian_restaurant', 'japanese_restaurant',
      ],
      maxResultCount: 20,
    };

    const response = await placesLib.Place.searchNearby(request);
    if (!response?.places?.length) return { restaurants: [], source: 'google' };

    const restaurants: Restaurant[] = response.places.map((place: any, index: number) => {
      const lat = typeof place.location?.lat === 'function' ? place.location.lat() : place.location?.lat ?? center.lat;
      const lng = typeof place.location?.lng === 'function' ? place.location.lng() : place.location?.lng ?? center.lng;
      const location: Coordinates = { lat, lng };

      let priceLevel: number | undefined;
      if (typeof place.priceLevel === 'number') {
        priceLevel = place.priceLevel;
      } else if (typeof place.priceLevel === 'string') {
        const levels: Record<string, number> = {
          PRICE_LEVEL_FREE: 1,
          PRICE_LEVEL_INEXPENSIVE: 1,
          PRICE_LEVEL_MODERATE: 2,
          PRICE_LEVEL_EXPENSIVE: 3,
          PRICE_LEVEL_VERY_EXPENSIVE: 4,
        };
        priceLevel = levels[place.priceLevel];
      }

      // getURI() genera una URL de imagen válida desde el SDK de Places.
      // No necesita hacer fetch/base64 ni añadir cabeceras desde Android.
      let photoUrl: string | undefined;
      const firstPhoto = Array.isArray(place.photos) ? place.photos[0] : undefined;
      if (firstPhoto) {
        try {
          if (typeof firstPhoto.getURI === 'function') {
            photoUrl = firstPhoto.getURI({ maxWidth: 800, maxHeight: 600 });
          } else if (typeof firstPhoto.getUrl === 'function') {
            photoUrl = firstPhoto.getUrl({ maxWidth: 800, maxHeight: 600 });
          }
        } catch (photoError) {
          console.warn('No se pudo obtener URI de foto para', place.displayName, photoError);
        }
      }

      return {
        id: place.id || `google_place_${index}`,
        name: place.displayName || 'Restaurante sin nombre',
        address: place.formattedAddress || 'Dirección no disponible',
        location,
        distanceMeters: calculateDistance(center, location),
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        priceLevel,
        isOpenNow: place.currentOpeningHours?.openNow,
        phoneNumber: place.nationalPhoneNumber,
        websiteUri: place.websiteURI,
        photoUrl,
        types: place.types || ['restaurant'],
        primaryType: place.primaryTypeDisplayName || place.primaryType || 'Restaurante',
      };
    });

    restaurants.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
    return { restaurants, source: 'google' };
  } catch (error) {
    console.error('Error consultando Google Places:', error);
    return { restaurants: [], source: 'fallback' };
  }
}

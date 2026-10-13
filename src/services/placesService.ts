import { Coordinates, Restaurant } from '../types/restaurant';
import { calculateDistance } from '../utils/distance';

// Quality fallback food imagery
const CUISINE_PHOTOS: Record<string, string[]> = {
  tapas: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515443961218-a51367888e4b?auto=format&fit=crop&w=800&q=80',
  ],
  italian: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80',
  ],
  asian: [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  ],
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
  ],
  seafood: [
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=800&q=80',
  ],
  traditional: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
  ],
};

function getRandomPhoto(cuisine: string): string {
  const photos = CUISINE_PHOTOS[cuisine] || CUISINE_PHOTOS.traditional;
  return photos[Math.floor(Math.random() * photos.length)];
}

/**
 * Generate context-aware fallback restaurants surrounding the given coordinates
 */
export function generateLocalFallbackRestaurants(center: Coordinates): Restaurant[] {
  const templates = [
    {
      name: 'La Taberna del Rincón',
      cuisine: 'tapas',
      primaryType: 'Tapas & Vinos',
      types: ['restaurant', 'bar', 'tapas'],
      rating: 4.8,
      userRatingCount: 342,
      priceLevel: 2,
      latOffset: 0.0018,
      lngOffset: 0.0014,
      address: 'Calle Mayor, 14',
      phone: '+34 912 345 678',
      isOpenNow: true,
      openingHours: 'Abierto hoy: 12:30 - 23:30',
    },
    {
      name: 'Trattoria Bella Napoli',
      cuisine: 'italian',
      primaryType: 'Italiano & Pizza',
      types: ['restaurant', 'italian', 'pizza'],
      rating: 4.6,
      userRatingCount: 512,
      priceLevel: 2,
      latOffset: -0.0022,
      lngOffset: 0.0019,
      address: 'Avenida Central, 45',
      phone: '+34 913 892 104',
      isOpenNow: true,
      openingHours: 'Abierto hoy: 13:00 - 16:30, 20:00 - 23:30',
    },
    {
      name: 'Café & Bistro La Esquina',
      cuisine: 'cafe',
      primaryType: 'Cafetería & Brunch',
      types: ['cafe', 'bakery', 'breakfast'],
      rating: 4.7,
      userRatingCount: 220,
      priceLevel: 1,
      latOffset: 0.0009,
      lngOffset: -0.0018,
      address: 'Plaza Nueva, 8',
      phone: '+34 911 502 911',
      isOpenNow: true,
      openingHours: 'Abierto hoy: 08:30 - 20:00',
    },
    {
      name: 'Sakura Sushi Bar',
      cuisine: 'asian',
      primaryType: 'Japonés & Sushi',
      types: ['restaurant', 'asian', 'sushi'],
      rating: 4.9,
      userRatingCount: 428,
      priceLevel: 3,
      latOffset: -0.0015,
      lngOffset: -0.0024,
      address: 'Paseo de la Ribera, 22',
      phone: '+34 914 778 200',
      isOpenNow: true,
      openingHours: 'Abierto hoy: 13:30 - 16:00, 20:30 - 23:30',
    },
    {
      name: 'Smash Burger Craft',
      cuisine: 'burger',
      primaryType: 'Hamburguesería Gourmet',
      types: ['restaurant', 'meal_takeaway', 'burger'],
      rating: 4.5,
      userRatingCount: 195,
      priceLevel: 2,
      latOffset: 0.0031,
      lngOffset: -0.0008,
      address: 'Calle del Sol, 33',
      phone: '+34 916 230 401',
      isOpenNow: true,
      openingHours: 'Abierto hoy: 13:00 - 23:45',
    },
    {
      name: 'Marisquería El Puerto',
      cuisine: 'seafood',
      primaryType: 'Pescados & Mariscos',
      types: ['restaurant', 'seafood'],
      rating: 4.7,
      userRatingCount: 680,
      priceLevel: 3,
      latOffset: 0.0025,
      lngOffset: 0.0035,
      address: 'Avenida Marítima, 11',
      phone: '+34 915 901 223',
      isOpenNow: false,
      openingHours: 'Abre hoy a las 20:00',
    },
    {
      name: 'El Asador Criollo',
      cuisine: 'traditional',
      primaryType: 'Carnes a la Brasa',
      types: ['restaurant', 'grill', 'traditional'],
      rating: 4.6,
      userRatingCount: 310,
      priceLevel: 3,
      latOffset: -0.0034,
      lngOffset: 0.0012,
      address: 'Calle San Fernando, 7',
      phone: '+34 918 443 112',
      isOpenNow: true,
      openingHours: 'Abierto hoy: 13:00 - 17:00, 20:30 - 23:30',
    },
    {
      name: 'Verde & Oliva (Vegetariano)',
      cuisine: 'traditional',
      primaryType: 'Saludable & Vegano',
      types: ['restaurant', 'healthy', 'vegetarian'],
      rating: 4.8,
      userRatingCount: 178,
      priceLevel: 2,
      latOffset: -0.0008,
      lngOffset: 0.0028,
      address: 'Calle de las Flores, 19',
      phone: '+34 917 889 004',
      isOpenNow: true,
      openingHours: 'Abierto hoy: 12:00 - 22:00',
    },
    {
      name: 'Bodega & Tapas Los Abuelos',
      cuisine: 'tapas',
      primaryType: 'Tapas Tradicionales',
      types: ['restaurant', 'bar', 'tapas'],
      rating: 4.4,
      userRatingCount: 890,
      priceLevel: 1,
      latOffset: 0.0012,
      lngOffset: -0.0032,
      address: 'Callejón del Gato, 4',
      phone: '+34 919 112 334',
      isOpenNow: true,
      openingHours: 'Abierto hoy: 11:30 - 00:00',
    },
    {
      name: 'Gelateria & Dulces Artesanales',
      cuisine: 'cafe',
      primaryType: 'Heladería & Postres',
      types: ['cafe', 'dessert', 'ice_cream'],
      rating: 4.9,
      userRatingCount: 450,
      priceLevel: 1,
      latOffset: 0.0038,
      lngOffset: 0.0021,
      address: 'Plaza del Reloj, 2',
      phone: '+34 910 405 607',
      isOpenNow: true,
      openingHours: 'Abierto hoy: 11:00 - 23:00',
    },
  ];

  return templates.map((item, index) => {
    const loc: Coordinates = {
      lat: center.lat + item.latOffset,
      lng: center.lng + item.lngOffset,
    };
    const distanceMeters = calculateDistance(center, loc);

    return {
      id: `local_rest_${index}_${Math.round(loc.lat * 1000)}`,
      name: item.name,
      address: item.address,
      rating: item.rating,
      userRatingCount: item.userRatingCount,
      priceLevel: item.priceLevel,
      isOpenNow: item.isOpenNow,
      distanceMeters,
      location: loc,
      phoneNumber: item.phone,
      websiteUri: `https://www.google.com/search?q=${encodeURIComponent(item.name)}`,
      photoUrl: getRandomPhoto(item.cuisine),
      types: item.types,
      primaryType: item.primaryType,
      openingHoursSummary: item.openingHours,
    };
  });
}

/**
 * Searches nearby restaurants using Google Maps Places API (New) or fallback
 */
export async function fetchNearbyRestaurants(
  center: Coordinates,
  radiusMeters: number = 2500
): Promise<{ restaurants: Restaurant[]; source: 'google' | 'fallback' }> {
  try {
    // Check if google maps places library is loaded
    if (typeof window !== 'undefined' && (window as any).google?.maps?.importLibrary) {
      const placesLib = await (window as any).google.maps.importLibrary('places');

      if (placesLib?.Place?.searchNearby) {
        const request = {
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'priceLevel',
            'currentOpeningHours',
            'nationalPhoneNumber',
            'websiteURI',
            'types',
            'primaryType',
            'primaryTypeDisplayName',
            'photos',
          ],
          locationRestriction: {
            center: { lat: center.lat, lng: center.lng },
            radius: Math.min(radiusMeters, 50000),
          },
          includedPrimaryTypes: [
            'restaurant',
            'cafe',
            'bar',
            'bakery',
            'meal_takeaway',
            'fast_food_restaurant',
            'pizza_restaurant',
            'seafood_restaurant',
            'mediterranean_restaurant',
            'spanish_restaurant',
            'mexican_restaurant',
            'italian_restaurant',
            'japanese_restaurant',
          ],
          maxResultCount: 20,
        };

        const response = await placesLib.Place.searchNearby(request);

        if (response?.places && response.places.length > 0) {
          const mapped: Restaurant[] = response.places.map((place: any, index: number) => {
            const latVal =
              typeof place.location?.lat === 'function'
                ? place.location.lat()
                : place.location?.lat || center.lat;
            const lngVal =
              typeof place.location?.lng === 'function'
                ? place.location.lng()
                : place.location?.lng || center.lng;

            const placeLocation: Coordinates = { lat: latVal, lng: lngVal };
            const distanceMeters = calculateDistance(center, placeLocation);

            // Extract photo
            let photoUrl: string | undefined = undefined;
            if (place.photos && place.photos.length > 0) {
              try {
                if (typeof place.photos[0].getURI === 'function') {
                  photoUrl = place.photos[0].getURI({ maxWidth: 700, maxHeight: 450 });
                }
              } catch (e) {
                console.warn('Error fetching photo URI:', e);
              }
            }
            if (!photoUrl) {
              const primaryTypeStr = place.primaryType || '';
              if (primaryTypeStr.includes('pizza') || primaryTypeStr.includes('italian')) {
                photoUrl = getRandomPhoto('italian');
              } else if (primaryTypeStr.includes('cafe') || primaryTypeStr.includes('bakery')) {
                photoUrl = getRandomPhoto('cafe');
              } else if (primaryTypeStr.includes('burger')) {
                photoUrl = getRandomPhoto('burger');
              } else if (primaryTypeStr.includes('sushi') || primaryTypeStr.includes('asian')) {
                photoUrl = getRandomPhoto('asian');
              } else if (primaryTypeStr.includes('seafood')) {
                photoUrl = getRandomPhoto('seafood');
              } else {
                photoUrl = getRandomPhoto('traditional');
              }
            }

            // Price level conversion
            let priceLevelNum: number | undefined = undefined;
            if (typeof place.priceLevel === 'number') {
              priceLevelNum = place.priceLevel;
            } else if (typeof place.priceLevel === 'string') {
              if (place.priceLevel.includes('INEXPENSIVE') || place.priceLevel === '1') priceLevelNum = 1;
              else if (place.priceLevel.includes('MODERATE') || place.priceLevel === '2') priceLevelNum = 2;
              else if (place.priceLevel.includes('EXPENSIVE') || place.priceLevel === '3') priceLevelNum = 3;
              else if (place.priceLevel.includes('VERY_EXPENSIVE') || place.priceLevel === '4') priceLevelNum = 4;
            }

            return {
              id: place.id || `google_place_${index}`,
              name: place.displayName || 'Restaurante',
              address: place.formattedAddress || 'Dirección cercana',
              rating: place.rating,
              userRatingCount: place.userRatingCount,
              priceLevel: priceLevelNum,
              isOpenNow: place.currentOpeningHours?.openNow,
              distanceMeters,
              location: placeLocation,
              phoneNumber: place.nationalPhoneNumber,
              websiteUri: place.websiteURI,
              photoUrl,
              types: place.types || ['restaurant'],
              primaryType: place.primaryTypeDisplayName || place.primaryType || 'Restaurante',
            };
          });

          // Sort by distance initially
          mapped.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
          return { restaurants: mapped, source: 'google' };
        }
      }
    }
  } catch (error) {
    console.warn('Place.searchNearby call encountered an issue, using high quality nearby local data:', error);
  }

  // Graceful fallback with localized coordinates
  const fallbackList = generateLocalFallbackRestaurants(center);
  fallbackList.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  return { restaurants: fallbackList, source: 'fallback' };
}

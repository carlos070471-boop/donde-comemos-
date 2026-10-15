import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Geolocation } from '@capacitor/geolocation';
import {
  UtensilsCrossed,
  MapPin,
  RefreshCw,
  AlertCircle,
  Compass,
  SlidersHorizontal,
  Heart,
  Navigation,
} from 'lucide-react';
import { Coordinates, FilterOptions, Restaurant } from './types/restaurant';
import { useFavorites } from './hooks/useFavorites';
import { fetchNearbyRestaurants } from './services/placesService';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { RestaurantCard } from './components/RestaurantCard';
import { RestaurantDetailModal } from './components/RestaurantDetailModal';
import { MapView } from './components/MapView';
import { FavoritesList } from './components/FavoritesList';
import { LocationPrompt } from './components/LocationPrompt';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyBC9GrSlb51EbmHs7p2ON8Ybj431vgIJ60';

// Default initial location: Madrid (Puerta del Sol)
const DEFAULT_LOCATION: Coordinates = {
  lat: 40.4168,
  lng: -3.7038,
};

export default function App() {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <MainApp />
    </APIProvider>
  );
}

function MainApp() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'list' | 'map' | 'favorites'>('list');

  // Location state
  const [userCoords, setUserCoords] = useState<Coordinates>(DEFAULT_LOCATION);
  const [locationLabel, setLocationLabel] = useState<string>('Detectando ubicación...');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // Restaurants state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Favorites hook
  const {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    updateFavoriteNote,
    clearFavorites,
    favoritesCount,
  } = useFavorites();

  // Filters state
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    selectedCategory: 'all',
    maxDistanceMeters: 2500,
    onlyOpenNow: false,
    sortBy: 'distance',
  });

    // Request native Android geolocation
  const requestBrowserLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);
    setLocationLabel('Detectando ubicación...');

    try {
      await Geolocation.requestPermissions();

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      const newCoords: Coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setUserCoords(newCoords);
      setLocationLabel('Tu ubicación GPS');
      setLocationError(null);
    } catch (error) {
      console.warn('Error obteniendo ubicación GPS:', error);

      setLocationLabel('Ubicación no disponible');
      setLocationError(
        'No se pudo obtener tu ubicación. Comprueba que el GPS esté activado y permite a la aplicación acceder a tu ubicación.'
      );
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Request location on initial mount
  useEffect(() => {
    requestBrowserLocation();
  }, [requestBrowserLocation]);

  // Load nearby restaurants when location or search radius changes
  useEffect(() => {
    let isCancelled = false;

    async function loadRestaurants() {
      setIsLoading(true);
      try {
        const result = await fetchNearbyRestaurants(
          userCoords,
          filters.maxDistanceMeters
        );
        if (!isCancelled) {
          setRestaurants(result.restaurants);
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRestaurants();

    return () => {
      isCancelled = true;
    };
  }, [userCoords, filters.maxDistanceMeters]);

  // Filter and sort restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((restaurant) => {
        // Search text filter
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchesName = restaurant.name.toLowerCase().includes(q);
          const matchesAddress = restaurant.address.toLowerCase().includes(q);
          const matchesType =
            restaurant.primaryType?.toLowerCase().includes(q) ||
            restaurant.types?.some((t) => t.toLowerCase().includes(q));
          if (!matchesName && !matchesAddress && !matchesType) {
            return false;
          }
        }

        // Category filter
        if (filters.selectedCategory !== 'all') {
          const cat = filters.selectedCategory.toLowerCase();
          const pType = (restaurant.primaryType || '').toLowerCase();
          const typesList = restaurant.types?.map((t) => t.toLowerCase()) || [];

          if (cat === 'tapas') {
            const matches =
              pType.includes('tapa') ||
              pType.includes('bar') ||
              typesList.includes('bar') ||
              typesList.includes('tapas');
            if (!matches) return false;
          } else if (cat === 'italian') {
            const matches =
              pType.includes('italian') ||
              pType.includes('pizza') ||
              typesList.includes('italian') ||
              typesList.includes('pizza');
            if (!matches) return false;
          } else if (cat === 'cafe') {
            const matches =
              pType.includes('caf') ||
              pType.includes('brunch') ||
              typesList.includes('cafe') ||
              typesList.includes('bakery');
            if (!matches) return false;
          } else if (cat === 'asian') {
            const matches =
              pType.includes('asian') ||
              pType.includes('sushi') ||
              pType.includes('japon') ||
              pType.includes('chino') ||
              typesList.includes('asian') ||
              typesList.includes('sushi');
            if (!matches) return false;
          } else if (cat === 'burger') {
            const matches =
              pType.includes('burger') ||
              pType.includes('hamburg') ||
              typesList.includes('burger') ||
              typesList.includes('fast_food');
            if (!matches) return false;
          } else if (cat === 'seafood') {
            const matches =
              pType.includes('marisc') ||
              pType.includes('seafood') ||
              pType.includes('pescad') ||
              typesList.includes('seafood');
            if (!matches) return false;
          } else if (cat === 'healthy') {
            const matches =
              pType.includes('vegan') ||
              pType.includes('vegetar') ||
              pType.includes('salud') ||
              typesList.includes('vegetarian');
            if (!matches) return false;
          }
        }

        // Distance filter
        if (
          restaurant.distanceMeters !== undefined &&
          restaurant.distanceMeters > filters.maxDistanceMeters
        ) {
          return false;
        }

        // Open now filter
        if (filters.onlyOpenNow && restaurant.isOpenNow !== true) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (filters.sortBy === 'reviews') {
          return (b.userRatingCount || 0) - (a.userRatingCount || 0);
        }
        // default: distance
        return (a.distanceMeters || 0) - (b.distanceMeters || 0);
      });
  }, [restaurants, filters]);

  // Handle switching to map view and focusing a restaurant
  const handleViewOnMap = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setActiveTab('map');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900">
      {/* Header with Navigation and Location Pill */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favoritesCount}
        locationLabel={locationLabel}
        isLocating={isLocating}
        onRefreshLocation={requestBrowserLocation}
        onChangeLocationClick={() => setIsLocationModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Location Notice Banner if geolocation was blocked or pending */}
        {locationError && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locationError}</span>
            </div>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
            >
              Elegir ciudad
            </button>
          </div>
        )}

        {/* View Mode 1: Favorites View */}
        {activeTab === 'favorites' && (
          <FavoritesList
            favorites={favorites}
            onSelectRestaurant={(r) => setSelectedRestaurant(r)}
            onRemoveFavorite={removeFavorite}
            onClearFavorites={clearFavorites}
            onExploreClick={() => setActiveTab('list')}
            onUpdateNote={updateFavoriteNote}
          />
        )}

        {/* View Mode 2 & 3: List and Map Views */}
        {activeTab !== 'favorites' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              totalResults={filteredRestaurants.length}
            />

            {/* Split / Responsive Layout:
                - On desktop (lg+): when tab is 'list', show list on left and map on right for best UX
                - When tab is 'map': show map full width
            */}
            {activeTab === 'map' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>
                    Mostrando {filteredRestaurants.length} restaurantes en el mapa
                  </span>
                  <button
                    onClick={() => setActiveTab('list')}
                    className="font-semibold text-amber-600 hover:underline"
                  >
                    Ver en lista
                  </button>
                </div>
                <MapView
                  userLocation={userCoords}
                  restaurants={filteredRestaurants}
                  selectedRestaurant={selectedRestaurant}
                  onSelectRestaurant={(r) => setSelectedRestaurant(r)}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            ) : (
              /* 'list' View Mode */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Restaurant Cards List */}
                <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                  {/* Results summary row */}
                  <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                    <span>
                      {isLoading ? (
                        'Buscando restaurantes cercanos...'
                      ) : (
                        <>
                          <strong className="text-stone-800">
                            {filteredRestaurants.length}
                          </strong>{' '}
                          restaurantes encontrados cerca de ti
                        </>
                      )}
                    </span>
                    <button
                      onClick={() => setActiveTab('map')}
                      className="lg:hidden font-semibold text-amber-600 hover:underline flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Ver en mapa</span>
                    </button>
                  </div>

                  {/* Loading State */}
                  {isLoading && (
                    <div className="space-y-3 py-6">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="bg-white rounded-2xl p-4 border border-stone-200 animate-pulse flex flex-col sm:flex-row gap-4"
                        >
                          <div className="w-full sm:w-48 h-36 bg-stone-200 rounded-xl" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-stone-200 rounded w-1/3" />
                            <div className="h-6 bg-stone-200 rounded w-3/4" />
                            <div className="h-4 bg-stone-200 rounded w-1/2" />
                            <div className="h-4 bg-stone-200 rounded w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoading && filteredRestaurants.length === 0 && (
                    <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200/90 shadow-xs">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
                        <UtensilsCrossed className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-bold text-stone-900 mb-1">
                        No se encontraron restaurantes
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-500 mb-5 max-w-sm mx-auto">
                        Prueba a ampliar el radio de búsqueda o a borrar los filtros aplicados.
                      </p>
                      <button
                        onClick={() =>
                          setFilters({
                            searchQuery: '',
                            selectedCategory: 'all',
                            maxDistanceMeters: 5000,
                            onlyOpenNow: false,
                            sortBy: 'distance',
                          })
                        }
                        className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        Restablecer todos los filtros
                      </button>
                    </div>
                  )}

                  {/* List of Restaurant Cards */}
                  {!isLoading &&
                    filteredRestaurants.map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                        isFavorite={isFavorite(restaurant.id)}
                        onToggleFavorite={toggleFavorite}
                        onSelect={(r) => setSelectedRestaurant(r)}
                      />
                    ))}
                </div>

                {/* Right Column (Desktop sticky map) */}
                <div className="hidden lg:block lg:col-span-5 xl:col-span-5 sticky top-24">
                  <MapView
                    userLocation={userCoords}
                    restaurants={filteredRestaurants}
                    selectedRestaurant={selectedRestaurant}
                    onSelectRestaurant={(r) => setSelectedRestaurant(r)}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Restaurant Detail Modal (Triggered on click of any restaurant card/marker) */}
      <RestaurantDetailModal
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
        isFavorite={
          selectedRestaurant ? isFavorite(selectedRestaurant.id) : false
        }
        onToggleFavorite={toggleFavorite}
        onUpdateNote={updateFavoriteNote}
        onViewOnMap={handleViewOnMap}
      />

      {/* Change Location Modal / Selector */}
      <LocationPrompt
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentCoords={userCoords}
        onSelectCoords={(coords, label) => {
          setUserCoords(coords);
          setLocationLabel(label);
          setLocationError(null);
        }}
        onRequestBrowserLocation={requestBrowserLocation}
        isLocating={isLocating}
      />
    </div>
  );
}

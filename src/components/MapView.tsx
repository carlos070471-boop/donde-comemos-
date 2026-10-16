import { RestaurantPhoto } from './RestaurantPhoto';
import React, { useState } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Utensils, Heart, Star, Navigation, MapPin, ExternalLink } from 'lucide-react';
import { Coordinates, Restaurant } from '../types/restaurant';
import { formatDistance, getDirectionsUrl } from '../utils/distance';

interface MapViewProps {
  userLocation: Coordinates;
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (restaurant: Restaurant) => void;
}

// Controller to smoothly center map when selectedRestaurant changes
const MapRecenter: React.FC<{ target: Coordinates | null }> = ({ target }) => {
  const map = useMap();
  React.useEffect(() => {
    if (map && target) {
      map.panTo({ lat: target.lat, lng: target.lng });
    }
  }, [map, target]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  userLocation,
  restaurants,
  selectedRestaurant,
  onSelectRestaurant,
  isFavorite,
  onToggleFavorite,
}) => {
  const [infoWindowRestaurant, setInfoWindowRestaurant] =
    useState<Restaurant | null>(null);

  return (
    <div className="relative w-full h-[500px] lg:h-[calc(100vh-160px)] rounded-3xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
      <Map
        internalUsageAttributionIds={['gmp_git_agentskills_v1']}
        mapId="DEMO_MAP_ID"
        defaultCenter={{ lat: userLocation.lat, lng: userLocation.lng }}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="w-full h-full"
      >
        <MapRecenter
          target={
            selectedRestaurant
              ? selectedRestaurant.location
              : userLocation
          }
        />

        {/* User GPS Location Marker */}
        <AdvancedMarker
          position={{ lat: userLocation.lat, lng: userLocation.lng }}
          title="Tu ubicación actual"
          zIndex={50}
        >
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 animate-ping absolute" />
            <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
        </AdvancedMarker>

        {/* Restaurant Markers */}
        {restaurants.map((rest) => {
          const isSelected = selectedRestaurant?.id === rest.id;
          const isFav = isFavorite(rest.id);

          return (
            <AdvancedMarker
              key={rest.id}
              position={{ lat: rest.location.lat, lng: rest.location.lng }}
              onClick={() => {
                setInfoWindowRestaurant(rest);
                onSelectRestaurant(rest);
              }}
              zIndex={isSelected ? 40 : 10}
            >
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full shadow-md transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white scale-115 ring-2 ring-amber-400'
                    : isFav
                    ? 'bg-rose-500 text-white'
                    : 'bg-white text-stone-900 hover:scale-105 border border-stone-200'
                }`}
              >
                {isFav ? (
                  <Heart className="w-3.5 h-3.5 fill-white text-white shrink-0" />
                ) : (
                  <Utensils
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? 'text-amber-400' : 'text-amber-600'
                    }`}
                  />
                )}
                <span className="text-xs font-bold max-w-[100px] truncate">
                  {rest.name}
                </span>
                {rest.rating && (
                  <span
                    className={`text-[10px] font-semibold px-1 py-0.2 rounded ${
                      isSelected ? 'bg-stone-800 text-amber-300' : 'text-amber-700'
                    }`}
                  >
                    ★{rest.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </AdvancedMarker>
          );
        })}

        {/* Interactive Info Window for clicked pin */}
        {infoWindowRestaurant && (
          <InfoWindow
            position={{
              lat: infoWindowRestaurant.location.lat,
              lng: infoWindowRestaurant.location.lng,
            }}
            onCloseClick={() => setInfoWindowRestaurant(null)}
          >
            <div className="w-64 p-1 text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
              {/* Photo */}
              <div className="relative h-28 w-full rounded-lg overflow-hidden mb-2 bg-stone-100">
                <RestaurantPhoto restaurant={infoWindowRestaurant} className="w-full h-full" />
                <button
                  onClick={() => onToggleFavorite(infoWindowRestaurant)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md shadow-xs ${
                    isFavorite(infoWindowRestaurant.id)
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/90 text-stone-700 hover:text-rose-500'
                  }`}
                  title="Favorito"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isFavorite(infoWindowRestaurant.id) ? 'fill-white' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Title & Info */}
              <h4 className="font-bold text-sm text-stone-900 line-clamp-1">
                {infoWindowRestaurant.name}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5 mb-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="font-semibold text-stone-800">
                  {infoWindowRestaurant.rating?.toFixed(1) || '4.5'}
                </span>
                <span>•</span>
                <span className="text-amber-700 font-medium">
                  {infoWindowRestaurant.primaryType || 'Restaurante'}
                </span>
                {infoWindowRestaurant.distanceMeters !== undefined && (
                  <>
                    <span>•</span>
                    <span className="font-medium">
                      {formatDistance(infoWindowRestaurant.distanceMeters)}
                    </span>
                  </>
                )}
              </div>

              <p className="text-[11px] text-stone-600 line-clamp-1 mb-3">
                {infoWindowRestaurant.address}
              </p>

              {/* Button to open full detail view */}
              <button
                onClick={() => onSelectRestaurant(infoWindowRestaurant)}
                className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                Ver detalles completos
              </button>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
};


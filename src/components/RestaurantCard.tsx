import React from 'react';
import { Heart, Star, MapPin, Navigation, Clock, Phone, ChevronRight } from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { formatDistance, getDirectionsUrl } from '../utils/distance';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isFavorite: boolean;
  onToggleFavorite: (restaurant: Restaurant) => void;
  onSelect: (restaurant: Restaurant) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  const priceString = restaurant.priceLevel
    ? '€'.repeat(restaurant.priceLevel)
    : '€€';

  return (
    <article
      onClick={() => onSelect(restaurant)}
      className="group bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col sm:flex-row overflow-hidden cursor-pointer relative"
    >
      {/* Thumbnail Image */}
      <div className="relative w-full sm:w-48 h-44 sm:h-auto bg-stone-100 shrink-0 overflow-hidden">
        <img
          src={restaurant.photoUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Distance Badge on Image */}
        {restaurant.distanceMeters !== undefined && (
          <div className="absolute bottom-2.5 left-2.5 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <Navigation className="w-3 h-3 text-amber-400" />
            <span>a {formatDistance(restaurant.distanceMeters)}</span>
          </div>
        )}

        {/* Favorite Button on Card */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(restaurant);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
            isFavorite
              ? 'bg-rose-500 text-white scale-105 hover:bg-rose-600'
              : 'bg-white/90 text-stone-600 hover:bg-white hover:text-rose-500 hover:scale-110'
          }`}
          title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Top category & tags */}
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                {restaurant.primaryType || 'Restaurante'}
              </span>
              <span className="text-xs text-stone-400 font-medium">{priceString}</span>
            </div>

            {restaurant.isOpenNow !== undefined && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  restaurant.isOpenNow
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-stone-100 text-stone-500 border border-stone-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    restaurant.isOpenNow ? 'bg-emerald-500' : 'bg-stone-400'
                  }`}
                />
                {restaurant.isOpenNow ? 'Abierto' : 'Cerrado'}
              </span>
            )}
          </div>

          {/* Restaurant Title */}
          <h3 className="font-bold text-stone-900 text-base sm:text-lg group-hover:text-amber-600 transition-colors line-clamp-1">
            {restaurant.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-1 mb-2">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{restaurant.rating?.toFixed(1) || '4.5'}</span>
            </div>
            {restaurant.userRatingCount && (
              <span className="text-xs text-stone-500">
                ({restaurant.userRatingCount} reseñas)
              </span>
            )}
          </div>

          {/* Address snippet */}
          <div className="flex items-start gap-1.5 text-xs text-stone-500 line-clamp-1 mb-2">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
            <span className="truncate">{restaurant.address}</span>
          </div>

          {/* User note preview if saved */}
          {restaurant.notes && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg px-2.5 py-1 text-xs text-stone-700 italic line-clamp-1 mb-2">
              Nota: "{restaurant.notes}"
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  getDirectionsUrl(restaurant.location, restaurant.name),
                  '_blank',
                  'noopener,noreferrer'
                );
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-amber-500 hover:text-white text-stone-700 transition-colors"
              title="Abrir indicaciones en Google Maps"
            >
              <Navigation className="w-3 h-3" />
              <span>Cómo llegar</span>
            </button>

            {restaurant.phoneNumber && (
              <a
                href={`tel:${restaurant.phoneNumber}`}
                onClick={(e) => e.stopPropagation()}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-stone-600 hover:bg-stone-100 hover:text-emerald-700 transition-colors"
                title="Llamar al restaurante"
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>Llamar</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 group-hover:translate-x-0.5 transition-transform">
            <span>Ver detalles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </article>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Star,
  MapPin,
  Navigation,
  Phone,
  ChevronRight,
} from 'lucide-react';

import { Restaurant } from '../types/restaurant';

import {
  formatDistance,
  getDirectionsUrl,
} from '../utils/distance';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isFavorite: boolean;
  onToggleFavorite: (restaurant: Restaurant) => void;
  onSelect: (restaurant: Restaurant) => void;
}

/*
 * Imagen ilustrativa integrada en la aplicación.
 * No necesita conexión a Internet.
 */
const FALLBACK_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 800 500">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
  </defs>

  <rect width="800" height="500" fill="url(#sky)"/>

  <rect y="385" width="800" height="115"
        fill="#d6d3d1"/>

  <rect x="125" y="115" width="550" height="290"
        rx="8" fill="#fafaf9"/>

  <rect x="125" y="115" width="550" height="65"
        fill="#92400e"/>

  <text x="400" y="157"
        font-family="Arial, sans-serif"
        font-size="32"
        font-weight="bold"
        text-anchor="middle"
        fill="#ffffff">
    RESTAURANTE
  </text>

  <rect x="165" y="205" width="150" height="135"
        fill="#a5d8e8"/>

  <rect x="485" y="205" width="150" height="135"
        fill="#a5d8e8"/>

  <rect x="345" y="205" width="110" height="200"
        fill="#78350f"/>

  <rect x="365" y="225" width="70" height="120"
        fill="#bae6fd"/>

  <circle cx="443" cy="310" r="6"
          fill="#fbbf24"/>

  <rect x="110" y="180" width="580" height="30"
        fill="#d97706"/>

  <path d="M110 210
           Q145 260 180 210
           Q215 260 250 210
           Q285 260 320 210
           Q355 260 390 210
           Q425 260 460 210
           Q495 260 530 210
           Q565 260 600 210
           Q635 260 690 210"
        fill="#f59e0b"
        stroke="#b45309"
        stroke-width="3"/>

  <rect x="0" y="445" width="800" height="55"
        fill="#292524"/>

  <text x="400" y="477"
        font-family="Arial, sans-serif"
        font-size="22"
        text-anchor="middle"
        fill="#ffffff">
    Imagen ilustrativa
  </text>
</svg>
`)}`;

export const RestaurantCard: React.FC<
  RestaurantCardProps
> = ({
  restaurant,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [restaurant.photoUrl]);

  const hasPhoto =
    Boolean(restaurant.photoUrl) && !imageError;

  const imageSource = hasPhoto
    ? restaurant.photoUrl
    : FALLBACK_IMAGE;

  const priceString = restaurant.priceLevel
    ? '€'.repeat(restaurant.priceLevel)
    : null;

  return (
    <article
      onClick={() => onSelect(restaurant)}
      className="
        group bg-white rounded-2xl
        border border-stone-200/90
        shadow-xs hover:shadow-md
        hover:border-amber-300
        transition-all duration-200
        flex flex-col sm:flex-row
        overflow-hidden cursor-pointer relative
      "
    >

      {/* FOTOGRAFÍA */}

      <div
        className="
          relative w-full sm:w-48
          h-44 sm:h-auto
          bg-stone-100 shrink-0 overflow-hidden
        "
      >

        <img
          src={imageSource}
          alt={
            hasPhoto
              ? `Fotografía de ${restaurant.name}`
              : 'Imagen ilustrativa de un restaurante'
          }
          loading="lazy"
          className="
            w-full h-full object-cover
            group-hover:scale-105
            transition-transform duration-300
          "
          onError={() => setImageError(true)}
        />

        {!hasPhoto && (
          <div
            className="
              absolute bottom-0 left-0 right-0
              bg-stone-900/80 text-white
              text-[10px] text-center py-1
            "
          >
            Imagen ilustrativa
          </div>
        )}

        {/* DISTANCIA */}

        {restaurant.distanceMeters !== undefined && (
          <div
            className="
              absolute bottom-2.5 left-2.5
              bg-stone-900/80
              backdrop-blur-xs
              text-white text-[11px]
              font-semibold px-2.5 py-1
              rounded-full flex items-center
              gap-1 shadow-xs
            "
          >
            <Navigation
              className="w-3 h-3 text-amber-400"
            />

            <span>
              a {formatDistance(
                restaurant.distanceMeters
              )}
            </span>
          </div>
        )}

        {/* FAVORITOS */}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(restaurant);
          }}
          className={`
            absolute top-2.5 right-2.5
            p-2 rounded-full
            backdrop-blur-md transition-all
            shadow-sm
            ${
              isFavorite
                ? 'bg-rose-500 text-white scale-105 hover:bg-rose-600'
                : 'bg-white/90 text-stone-600 hover:bg-white hover:text-rose-500 hover:scale-110'
            }
          `}
          title={
            isFavorite
              ? 'Quitar de favoritos'
              : 'Guardar en favoritos'
          }
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite ? 'fill-white' : ''
            }`}
          />
        </button>

      </div>

      {/* INFORMACIÓN */}

      <div
        className="
          p-4 sm:p-5 flex-1
          flex flex-col justify-between
        "
      >

        <div>

          {/* CATEGORÍA Y PRECIO */}

          <div
            className="
              flex items-center
              justify-between gap-2
              mb-1.5 flex-wrap
            "
          >

            <div
              className="flex items-center gap-1.5"
            >

              <span
                className="
                  text-[11px] font-semibold
                  tracking-wide uppercase
                  px-2 py-0.5 rounded-md
                  bg-amber-50 text-amber-700
                  border border-amber-200/60
                "
              >
                {restaurant.primaryType ||
                  'Restaurante'}
              </span>

              {priceString && (
                <span
                  className="
                    text-xs text-stone-400
                    font-medium
                  "
                >
                  {priceString}
                </span>
              )}

            </div>

            {/* ABIERTO O CERRADO */}

            {restaurant.isOpenNow !== undefined && (
              <span
                className={`
                  text-[11px] font-semibold
                  px-2 py-0.5 rounded-full
                  flex items-center gap-1
                  ${
                    restaurant.isOpenNow
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border border-stone-200'
                  }
                `}
              >

                <span
                  className={`
                    w-1.5 h-1.5 rounded-full
                    ${
                      restaurant.isOpenNow
                        ? 'bg-emerald-500'
                        : 'bg-stone-400'
                    }
                  `}
                />

                {restaurant.isOpenNow
                  ? 'Abierto'
                  : 'Cerrado'}

              </span>
            )}

          </div>

          {/* NOMBRE */}

          <h3
            className="
              font-bold text-stone-900
              text-base sm:text-lg
              group-hover:text-amber-600
              transition-colors line-clamp-1
            "
          >
            {restaurant.name}
          </h3>

          {/* VALORACIONES */}

          <div
            className="
              flex items-center gap-2
              mt-1 mb-2
            "
          >

            {restaurant.rating !== undefined &&
            restaurant.rating !== null ? (

              <div
                className="
                  flex items-center gap-1
                  text-xs font-bold
                  text-amber-700
                  bg-amber-100/60
                  px-2 py-0.5 rounded-md
                "
              >

                <Star
                  className="
                    w-3.5 h-3.5
                    fill-amber-500
                    text-amber-500
                  "
                />

                <span>
                  {restaurant.rating.toFixed(1)}
                </span>

              </div>

            ) : (

              <span
                className="text-xs text-stone-400"
              >
                Sin valoraciones
              </span>

            )}

            {restaurant.userRatingCount !== undefined &&
              restaurant.userRatingCount > 0 && (

                <span
                  className="text-xs text-stone-500"
                >
                  ({restaurant.userRatingCount} reseñas)
                </span>

              )}

          </div>

          {/* DIRECCIÓN */}

          <div
            className="
              flex items-start gap-1.5
              text-xs text-stone-500
              line-clamp-1 mb-2
            "
          >

            <MapPin
              className="
                w-3.5 h-3.5
                text-stone-400
                shrink-0 mt-0.5
              "
            />

            <span className="truncate">
              {restaurant.address}
            </span>

          </div>

          {/* NOTAS */}

          {restaurant.notes && (
            <div
              className="
                bg-amber-50/80
                border border-amber-200/80
                rounded-lg px-2.5 py-1
                text-xs text-stone-700
                italic line-clamp-1 mb-2
              "
            >
              Nota: "{restaurant.notes}"
            </div>
          )}

        </div>

        {/* BOTONES */}

        <div
          className="
            pt-3 border-t border-stone-100
            flex items-center justify-between
            gap-2 mt-2
          "
        >

          <div
            className="flex items-center gap-2"
          >

            {/* CÓMO LLEGAR */}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                window.open(
                  getDirectionsUrl(
                    restaurant.location,
                    restaurant.name
                  ),
                  '_blank',
                  'noopener,noreferrer'
                );
              }}
              className="
                inline-flex items-center
                gap-1 px-3 py-1.5
                text-xs font-semibold
                rounded-lg bg-stone-100
                hover:bg-amber-500
                hover:text-white
                text-stone-700
                transition-colors
              "
              title="Abrir indicaciones en Google Maps"
            >
              <Navigation className="w-3 h-3" />
              <span>Cómo llegar</span>
            </button>

            {/* LLAMAR */}

            {restaurant.phoneNumber && (
              <a
                href={`tel:${restaurant.phoneNumber}`}
                onClick={(e) => e.stopPropagation()}
                className="
                  hidden sm:inline-flex
                  items-center gap-1
                  px-2.5 py-1.5
                  text-xs font-medium
                  rounded-lg text-stone-600
                  hover:bg-stone-100
                  hover:text-emerald-700
                  transition-colors
                "
                title="Llamar al restaurante"
              >
                <Phone
                  className="
                    w-3 h-3 text-emerald-600
                  "
                />
                <span>Llamar</span>
              </a>
            )}

          </div>

          {/* VER DETALLES */}

          <div
            className="
              flex items-center gap-1
              text-xs font-semibold
              text-amber-600
              group-hover:translate-x-0.5
              transition-transform
            "
          >
            <span>Ver detalles</span>

            <ChevronRight
              className="w-3.5 h-3.5"
            />
          </div>

        </div>

      </div>

    </article>
  );
};

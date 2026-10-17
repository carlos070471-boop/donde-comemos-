import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';


interface Props {
  restaurant: {
    id: string;
    name: string;
    photoUrl?: string;
    location?: { lat: number; lng: number };
  };
  className?: string;
}

export function RestaurantPhoto({ restaurant, className = '' }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [restaurant.id, restaurant.photoUrl]);

  const mapsQuery = restaurant.location
    ? `${restaurant.name} ${restaurant.location.lat},${restaurant.location.lng}`
    : restaurant.name;

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      {restaurant.photoUrl && !imageFailed ? (
        <>
          <img
            src={restaurant.photoUrl}
            alt={`Fotografía de ${restaurant.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 text-center text-stone-500">
          <ImageOff className="w-6 h-6" />
          <span className="text-[10px]">Fotografía no disponible en fuentes abiertas</span>
          {<a className="text-[10px] underline text-amber-700"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
            target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()}>
            Ver en Google Maps
          </a>}
        </div>
      )}
    </div>
  );
}

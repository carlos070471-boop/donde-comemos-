import React, { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';

interface Props {
  restaurant: { id: string; name: string; photoUrl?: string };
  className?: string;
}

export function RestaurantPhoto({ restaurant, className = '' }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [restaurant.id, restaurant.photoUrl]);

  useEffect(() => {
    if (!element.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '150px' });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${encodeURIComponent(restaurant.id)}`;
  const showPhoto = visible && !!restaurant.photoUrl && !failed;

  return (
    <div ref={element} className={`relative overflow-hidden bg-stone-100 ${className}`}>
      {showPhoto ? (
        <>
          <img
            src={restaurant.photoUrl}
            alt={`Fotografía de ${restaurant.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setFailed(true)}
          />
          <div className="absolute z-20 bottom-0 inset-x-0 px-1 py-0.5 bg-black/70 text-white text-[9px] leading-tight">
            Google Maps
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 text-center text-stone-500">
          <ImageOff className="w-6 h-6" />
          <span className="text-[10px]">
            {!visible ? 'Cargando foto del local…' : failed ? 'No se pudo mostrar la foto' : 'El local no tiene foto disponible'}
          </span>
          {visible && (
            <a
              className="text-[10px] underline text-amber-700"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={event => event.stopPropagation()}
            >
              Ver en Google Maps
            </a>
          )}
        </div>
      )}
    </div>
  );
}

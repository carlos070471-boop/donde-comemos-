import React, { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { fetchRestaurantPhoto, PlacePhoto } from '../services/photoService';

interface Props {
  restaurant: { id: string; name: string; photoUrl?: string };
  className?: string;
}

export function RestaurantPhoto({ restaurant, className = '' }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [photo, setPhoto] = useState<PlacePhoto | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    if (!element.current) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '100px' });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setErrorMessage('');

    // Camino principal: la URL viene directamente del SDK Google Places.
    // Es la misma fuente que usa Maps y funciona mejor dentro de Android WebView.
    if (restaurant.photoUrl) {
      setPhoto({ url: restaurant.photoUrl, authors: [] });
      setStatus('ready');
      return () => { active = false; };
    }

    // Compatibilidad con favoritos antiguos que todavía no tengan photoUrl.
    setPhoto(null);
    setStatus('loading');
    fetchRestaurantPhoto(restaurant.id).then(result => {
      if (!active) return;
      setPhoto(result);
      setStatus(result ? 'ready' : 'missing');
    }).catch(error => {
      if (active) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Error de conexión');
      }
    });
    return () => { active = false; };
  }, [restaurant.id, restaurant.photoUrl, visible]);

  return (
    <div ref={element} className={`relative overflow-hidden bg-stone-100 ${className}`}>
      {photo && status === 'ready' ? (
        <>
          <img
            src={photo.url}
            alt={`Fotografía de ${restaurant.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => {
              setStatus('error');
              setErrorMessage('Android no pudo mostrar esta fotografía');
            }}
          />
          <div className="absolute z-20 bottom-0 inset-x-0 px-1 py-0.5 bg-black/70 text-white text-[9px] leading-tight">
            Google Maps{photo.authors.map((author, index) => (
              <React.Fragment key={index}> · {author.uri ? (
                <a href={author.uri} target="_blank" rel="noopener noreferrer"
                  onClick={event => event.stopPropagation()}>{author.displayName}</a>
              ) : author.displayName}</React.Fragment>
            ))}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 text-center text-stone-500">
          <ImageOff className="w-6 h-6" />
          <span className="text-[10px]">{status === 'loading' ? 'Cargando foto del local…' :
            status === 'missing' ? 'El local no tiene fotos disponibles' : 'No se pudo cargar la foto'}</span>
          {status === 'error' && errorMessage && <span className="text-[9px]">{errorMessage}</span>}
          {status !== 'loading' && <a className="text-[10px] underline text-amber-700"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${encodeURIComponent(restaurant.id)}`}
            target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()}>
            Ver en Google Maps
          </a>}
        </div>
      )}
    </div>
  );
}

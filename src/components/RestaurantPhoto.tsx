import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { fetchRestaurantPhoto } from '../services/photoService';

interface Props {
  restaurant: {
    id: string;
    name: string;
    photoUrl?: string;
    location?: { lat: number; lng: number };
  };
  className?: string;
}

const photoMemory = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();
const STORAGE_KEY = 'donde_comemos_photo_urls_v2';

function cachedPhoto(id: string): string | undefined {
  if (photoMemory.has(id)) return photoMemory.get(id);
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (typeof stored[id] === 'string') {
      photoMemory.set(id, stored[id]);
      return stored[id];
    }
  } catch { /* Storage may be unavailable. */ }
  return undefined;
}

function rememberPhoto(id: string, url: string) {
  photoMemory.set(id, url);
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    stored[id] = url;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch { /* Keep in memory when storage is unavailable. */ }
}

function forgetPhoto(id: string, url: string) {
  if (photoMemory.get(id) === url) photoMemory.delete(id);
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (stored[id] === url) {
      delete stored[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  } catch { /* Ignore storage errors. */ }
}

async function resolvePhoto(restaurant: Props['restaurant']): Promise<string | null> {
  const existing = pending.get(restaurant.id);
  if (existing) return existing;
  const request = fetchRestaurantPhoto(restaurant)
    .then(photo => {
      if (photo?.url) rememberPhoto(restaurant.id, photo.url);
      return photo?.url || null;
    })
    .catch(error => {
      console.warn('No se pudo recuperar la foto de', restaurant.name, error);
      return null;
    })
    .finally(() => pending.delete(restaurant.id));
  pending.set(restaurant.id, request);
  return request;
}

export function RestaurantPhoto({ restaurant, className = '' }: Props) {
  const [url, setUrl] = useState<string | undefined>(() => restaurant.photoUrl || cachedPhoto(restaurant.id));
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const known = restaurant.photoUrl || cachedPhoto(restaurant.id);
    setUrl(known);
    setImageFailed(false);
    if (known) {
      rememberPhoto(restaurant.id, known);
    } else {
      resolvePhoto(restaurant).then(found => {
        if (!cancelled && found) setUrl(found);
      });
    }
    return () => { cancelled = true; };
  }, [restaurant.id, restaurant.name, restaurant.photoUrl, restaurant.location?.lat, restaurant.location?.lng]);

  const mapsQuery = restaurant.location
    ? `${restaurant.name} ${restaurant.location.lat},${restaurant.location.lng}`
    : restaurant.name;

  function onImageError() {
    if (url) forgetPhoto(restaurant.id, url);
    setImageFailed(true);
  }

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      {url && !imageFailed ? (
        <img
          src={url}
          alt={`Fotografía de ${restaurant.name}`}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={onImageError}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 text-center text-stone-500">
          <ImageOff className="w-6 h-6" />
          <span className="text-[10px]">Fotografía no disponible en fuentes abiertas</span>
          <a className="text-[10px] underline text-amber-700"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
            target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()}>
            Ver en Google Maps
          </a>
        </div>
      )}
    </div>
  );
}

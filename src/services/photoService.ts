import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';

export interface PlacePhoto { url: string; authors: { displayName: string; uri?: string }[]; }

const memoryCache = new Map<string, PlacePhoto | null>();
const pending = new Map<string, Promise<PlacePhoto | null>>();
const CACHE_PREFIX = 'dondecomemos-photo-v2:';
let queue: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

const sleep = (ms:number) => new Promise(resolve => setTimeout(resolve, ms));
async function throttle() {
  const previous = queue;
  let release!: () => void;
  queue = new Promise<void>(r => { release = r; });
  await previous;
  const wait = Math.max(0, 450 - (Date.now() - lastRequestAt));
  if (wait) await sleep(wait);
  lastRequestAt = Date.now();
  release();
}

async function googleJson(url:string, headers:Record<string,string>, stage:string) {
  await throttle();
  for (let attempt=0; attempt<3; attempt++) {
    try {
      if (Capacitor.isNativePlatform()) {
        const response = await CapacitorHttp.get({url, headers, connectTimeout:12000, readTimeout:12000});
        if (response.status === 429 && attempt < 2) { await sleep(1500 * (attempt + 1)); continue; }
        if (response.status < 200 || response.status >= 300) throw new Error(`${stage}: Google respondió ${response.status}`);
        return response.data;
      }
      const response = await fetch(url,{headers,signal:AbortSignal.timeout(12000)});
      if (response.status === 429 && attempt < 2) { await sleep(1500 * (attempt + 1)); continue; }
      if (!response.ok) throw new Error(`${stage}: Google respondió ${response.status}`);
      return response.json();
    } catch(error) {
      if (attempt < 2 && !(error instanceof Error && error.message.includes('Google respondió'))) { await sleep(800); continue; }
      if (error instanceof Error && error.message.startsWith(`${stage}:`)) throw error;
      throw new Error(`${stage}: error de conexión`);
    }
  }
}

async function loadPhoto(placeId:string):Promise<PlacePhoto|null> {
  const headers={'X-Goog-Api-Key':GOOGLE_MAPS_API_KEY};
  const details=await googleJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,{...headers,'X-Goog-FieldMask':'photos'},'Consulta de fotos');
  const photos=Array.isArray(details?.photos)?details.photos:[];
  const photo=photos.find((item:any)=>typeof item?.name==='string');
  if(!photo) return null;
  const media=await googleJson(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`,headers,'Descarga de foto');
  if(!media?.photoUri || typeof media.photoUri!=='string') return null;
  return {url:media.photoUri,authors:Array.isArray(photo.authorAttributions)?photo.authorAttributions:[]};
}

export async function fetchRestaurantPhoto(placeId:string):Promise<PlacePhoto|null> {
  if(!placeId || placeId.startsWith('google_place_')) return null;
  if(memoryCache.has(placeId)) return memoryCache.get(placeId) ?? null;
  try {
    const saved=localStorage.getItem(CACHE_PREFIX+placeId);
    if(saved) { const parsed=JSON.parse(saved) as PlacePhoto; if(parsed?.url){memoryCache.set(placeId,parsed);return parsed;} }
  } catch {}
  const existing=pending.get(placeId); if(existing) return existing;
  const request=loadPhoto(placeId).then(result=>{
    memoryCache.set(placeId,result);
    if(result) try { localStorage.setItem(CACHE_PREFIX+placeId,JSON.stringify(result)); } catch {}
    return result;
  }).finally(()=>pending.delete(placeId));
  pending.set(placeId,request);
  return request;
}

import { configError, httpError, offlineError } from './errors';
import type { Cafe } from '@/types/cafe';
import type { CafeDetails } from '@/types/cafeDetails';

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';
const PHOTO_MAX_COUNT = 3;
const PHOTO_MAX_WIDTH_PX = 400;
const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.types',
  'places.photos',
].join(',');
// Champs strictement nécessaires pour réafficher un café enregistré : plus
// léger (et moins cher) que le masque complet de la fiche détaillée.
const SNAPSHOT_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'types',
  'photos',
].join(',');
const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'types',
  'photos',
  'internationalPhoneNumber',
  'websiteUri',
  'regularOpeningHours',
  'priceLevel',
].join(',');

const TYPE_LABELS: Record<string, string> = {
  cafe: 'Café',
  coffee_shop: 'Coffee shop',
  bakery: 'Boulangerie',
  restaurant: 'Restaurant',
  bar: 'Bar',
  book_store: 'Librairie',
};

function toTags(types: string[] | undefined): string[] {
  return (types ?? [])
    .map((type) => TYPE_LABELS[type])
    .filter((label): label is string => Boolean(label))
    .slice(0, 3);
}

type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  types?: string[];
  photos?: { name: string }[];
  userRatingCount?: number;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  priceLevel?: string;
};

/**
 * Fiche d'un café telle qu'on peut la conserver en cache : les photos y sont
 * des références Google, pas des URLs. Une URL de photo embarque la clé API et
 * expire — la stocker rendrait les images cassées après une rotation de clé.
 */
export type CafeSnapshot = Omit<Cafe, 'photoUrls'> & { photoRefs: string[] };

function apiKeyOrThrow(): string {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw configError();
  return apiKey;
}

function buildPhotoUrls(refs: string[]): string[] {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];
  return refs.map(
    (ref) =>
      `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${PHOTO_MAX_WIDTH_PX}&key=${apiKey}`
  );
}

function toSnapshot(place: GooglePlace): CafeSnapshot {
  const tags = toTags(place.types);
  return {
    id: place.id,
    name: place.displayName?.text ?? 'Café',
    tagline: tags.join(' · ') || 'Café de quartier',
    address: place.formattedAddress ?? '',
    rating: place.rating ?? 0,
    tags,
    latitude: place.location?.latitude ?? 0,
    longitude: place.location?.longitude ?? 0,
    photoRefs: (place.photos ?? []).slice(0, PHOTO_MAX_COUNT).map((photo) => photo.name),
  };
}

/** Reconstruit les URLs de photos avec la clé API courante. */
export function materializeCafe(snapshot: CafeSnapshot): Cafe {
  const { photoRefs, ...rest } = snapshot;
  return { ...rest, photoUrls: buildPhotoUrls(photoRefs) };
}

async function requestPlaces<T>(url: string, fieldMask: string, body?: unknown): Promise<T> {
  const apiKey = apiKeyOrThrow();

  let response: Response;
  try {
    response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    // `fetch` ne rejette que faute de réseau : pas de réponse HTTP à lire.
    throw offlineError(err);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw httpError(response.status, text);
  }

  return response.json();
}

export async function fetchNearbyCafes(
  latitude: number,
  longitude: number,
  radiusMeters = 1500
): Promise<Cafe[]> {
  const data = await requestPlaces<{ places?: GooglePlace[] }>(SEARCH_URL, SEARCH_FIELD_MASK, {
    includedTypes: ['cafe'],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius: radiusMeters,
      },
    },
  });

  return (data.places ?? [])
    .filter((place) => place.location?.latitude != null && place.location?.longitude != null)
    .map((place) => materializeCafe(toSnapshot(place)));
}

/** Fiche minimale d'un café à partir de son identifiant, pour le cache local. */
export async function fetchCafeSnapshot(placeId: string): Promise<CafeSnapshot> {
  const place = await requestPlaces<GooglePlace>(
    `${DETAILS_URL}/${placeId}`,
    SNAPSHOT_FIELD_MASK
  );
  return toSnapshot(place);
}

export async function fetchPlaceDetails(placeId: string): Promise<CafeDetails> {
  const place = await requestPlaces<GooglePlace>(`${DETAILS_URL}/${placeId}`, DETAILS_FIELD_MASK);

  return {
    ...materializeCafe(toSnapshot(place)),
    userRatingCount: place.userRatingCount ?? null,
    phone: place.internationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    openingHours: place.regularOpeningHours?.weekdayDescriptions ?? null,
    priceLevel: place.priceLevel ?? null,
  };
}

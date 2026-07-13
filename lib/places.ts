import type { Cafe } from '@/types/cafe';

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const PHOTO_MAX_COUNT = 3;
const PHOTO_MAX_WIDTH_PX = 400;
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.types',
  'places.photos',
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
  if (!types) return [];
  return types
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
};

function toPhotoUrls(photos: { name: string }[] | undefined, apiKey: string): string[] {
  if (!photos) return [];
  return photos.slice(0, PHOTO_MAX_COUNT).map(
    (photo) =>
      `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${PHOTO_MAX_WIDTH_PX}&key=${apiKey}`
  );
}

export async function fetchNearbyCafes(
  latitude: number,
  longitude: number,
  radiusMeters = 1500
): Promise<Cafe[]> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY manquante — vérifie ton fichier .env');
  }

  const response = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: ['cafe'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: radiusMeters,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Places API a répondu ${response.status}: ${body}`);
  }

  const data: { places?: GooglePlace[] } = await response.json();

  return (data.places ?? [])
    .filter((place) => place.location?.latitude != null && place.location?.longitude != null)
    .map((place) => ({
      id: place.id,
      name: place.displayName?.text ?? 'Café',
      tagline: toTags(place.types).join(' · ') || 'Café de quartier',
      address: place.formattedAddress ?? '',
      rating: place.rating ?? 0,
      tags: toTags(place.types),
      latitude: place.location!.latitude!,
      longitude: place.location!.longitude!,
      photoUrls: toPhotoUrls(place.photos, apiKey),
    }));
}

type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_METERS = 6371000;

export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

const METERS_PER_LAT_DEGREE = 111320;
const MIN_SEARCH_RADIUS_METERS = 500;
const MAX_SEARCH_RADIUS_METERS = 50000; // limite de l'API Google Places Nearby Search

// Rayon (en mètres) couvrant la zone actuellement visible à l'écran, pour que
// dézoomer élargisse réellement la recherche au lieu de rester bloqué sur le
// petit rayon de la toute première recherche.
export function regionToRadiusMeters(region: {
  latitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}): number {
  const latMeters = region.latitudeDelta * METERS_PER_LAT_DEGREE;
  const lngMeters =
    region.longitudeDelta * METERS_PER_LAT_DEGREE * Math.cos((region.latitude * Math.PI) / 180);
  const radius = Math.max(latMeters, lngMeters) / 2;
  return Math.min(MAX_SEARCH_RADIUS_METERS, Math.max(MIN_SEARCH_RADIUS_METERS, radius));
}

export function destinationPoint(origin: LatLng, bearingDeg: number, distance: number): LatLng {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const angularDistance = distance / EARTH_RADIUS_METERS;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(origin.latitude);
  const lng1 = toRad(origin.longitude);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return { latitude: toDeg(lat2), longitude: toDeg(lng2) };
}

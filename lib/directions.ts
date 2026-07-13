import { Linking, Platform } from 'react-native';

type DirectionsTarget = {
  name: string;
  latitude: number;
  longitude: number;
};

export function openDirections(cafe: DirectionsTarget) {
  const label = encodeURIComponent(cafe.name);
  const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${cafe.latitude},${cafe.longitude}`;

  const url =
    Platform.OS === 'ios'
      ? `maps://?daddr=${cafe.latitude},${cafe.longitude}&dirflg=d&q=${label}`
      : Platform.OS === 'android'
        ? `google.navigation:q=${cafe.latitude},${cafe.longitude}`
        : fallbackUrl;

  Linking.openURL(url).catch(() => {
    Linking.openURL(fallbackUrl);
  });
}

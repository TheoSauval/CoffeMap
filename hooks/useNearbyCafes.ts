import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { fetchNearbyCafes } from '@/lib/places';
import type { Cafe } from '@/types/cafe';

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const PARIS_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export function useNearbyCafes() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [region, setRegion] = useState<Region>(PARIS_REGION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        let latitude = PARIS_REGION.latitude;
        let longitude = PARIS_REGION.longitude;

        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({});
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }

        const nearby = await fetchNearbyCafes(latitude, longitude);
        if (cancelled) return;

        setCafes(nearby);
        setRegion({ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Impossible de charger les cafés');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { cafes, region, loading, error };
}

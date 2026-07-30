import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { fetchNearbyCafes } from '@/lib/places';
import { toUserMessage } from '@/lib/errors';
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

export function useNearbyCafes(radiusMeters = 1500) {
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
          try {
            const position = await Location.getCurrentPositionAsync({});
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
          } catch (err) {
            // Autorisation accordée mais position indisponible (GPS coupé,
            // émulateur sans coordonnées) : on garde la zone par défaut plutôt
            // que de bloquer l'écran sur une erreur.
            console.warn('Position indisponible, repli sur la zone par défaut', err);
          }
        }

        const nearby = await fetchNearbyCafes(latitude, longitude, radiusMeters);
        if (cancelled) return;

        setCafes(nearby);
        setRegion({ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      } catch (err) {
        if (!cancelled) {
          setError(toUserMessage(err, 'Impossible de charger les cafés autour de toi.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [radiusMeters]);

  return { cafes, region, loading, error };
}

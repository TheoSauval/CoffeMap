import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT, type Region as MapRegion } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import { useNearbyCafes } from '@/hooks/useNearbyCafes';
import { fetchNearbyCafes } from '@/lib/places';
import { distanceMeters } from '@/lib/geo';
import { openDirections } from '@/lib/directions';
import type { Cafe } from '@/types/cafe';

const SEARCH_HERE_THRESHOLD_METERS = 800;
const SEARCH_DEBOUNCE_MS = 600;

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const { cafes: initialCafes, region: initialRegion, loading, error } = useNearbyCafes();

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchCenterRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading) {
      setCafes(initialCafes);
      searchCenterRef.current = { latitude: initialRegion.latitude, longitude: initialRegion.longitude };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const searchArea = async (center: { latitude: number; longitude: number }) => {
    setSearching(true);
    setSearchError(null);
    try {
      const results = await fetchNearbyCafes(center.latitude, center.longitude);
      setCafes(results);
      searchCenterRef.current = center;
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Impossible de charger les cafés');
    } finally {
      setSearching(false);
    }
  };

  const handleRegionChangeComplete = (nextRegion: MapRegion) => {
    const center = { latitude: nextRegion.latitude, longitude: nextRegion.longitude };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const current = searchCenterRef.current;
      if (!current || distanceMeters(current, center) > SEARCH_HERE_THRESHOLD_METERS) {
        searchArea(center);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const centerOnUser = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const position = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.espresso} size="large" />
          <Text style={styles.loadingText}>Recherche des cafés autour de toi…</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPress={() => setSelectedCafe(null)}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {cafes.map((cafe) => (
            <Marker
              key={cafe.id}
              coordinate={{ latitude: cafe.latitude, longitude: cafe.longitude }}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedCafe(cafe);
              }}
            >
              <View style={styles.pin}>
                <Ionicons name="cafe" size={16} color={colors.paper} />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {(error || searchError) && !loading && (
        <SafeAreaView style={styles.errorBanner} pointerEvents="none">
          <Text style={styles.errorText}>{error ?? searchError}</Text>
        </SafeAreaView>
      )}

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            coffee<Text style={{ color: colors.terracotta }}>map</Text>
          </Text>
          <Pressable style={styles.locateButton} onPress={centerOnUser}>
            <Ionicons name="locate" size={20} color={colors.espresso} />
          </Pressable>
        </View>

        {searching && (
          <View style={[styles.searchingPill, shadow.card]}>
            <ActivityIndicator size="small" color={colors.paper} />
            <Text style={styles.searchHereText}>Mise à jour des cafés…</Text>
          </View>
        )}
      </SafeAreaView>

      {selectedCafe && (
        <SafeAreaView style={styles.bottomOverlay} pointerEvents="box-none">
          <Pressable style={[styles.previewCard, shadow.card]} onPress={() => setSelectedCafe(null)}>
            <View style={styles.previewIcon}>
              <Ionicons name="cafe" size={22} color={colors.paper} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>{selectedCafe.name}</Text>
              <Text style={styles.previewAddress} numberOfLines={1}>
                {selectedCafe.address}
              </Text>
            </View>
            {selectedCafe.rating > 0 && (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={12} color={colors.espresso} />
                <Text style={styles.ratingText}>{selectedCafe.rating.toFixed(1)}</Text>
              </View>
            )}

            <Pressable style={styles.directionsButton} onPress={() => openDirections(selectedCafe)}>
              <Ionicons name="navigate" size={18} color={colors.paper} />
            </Pressable>

            <Pressable
              style={styles.infoButton}
              onPress={() => router.push(`/cafe/${selectedCafe.id}`)}
            >
              <Ionicons name="information-circle-outline" size={22} color={colors.espresso} />
            </Pressable>
          </Pressable>

          {selectedCafe.photoUrls.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              {selectedCafe.photoUrls.map((url) => (
                <Image key={url} source={{ uri: url }} style={styles.photo} />
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.paper,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.bricolageTest,
    fontSize: 24,
    color: colors.ink,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  searchingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.espresso,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  searchHereText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.paper,
  },
  locateButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.paper,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  previewAddress: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.latte,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  ratingText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.espresso,
  },
  directionsButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  photo: {
    width: 140,
    height: 100,
    borderRadius: radius.md,
    backgroundColor: colors.creamDark,
  },
});

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
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
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { useFavorites } from '@/lib/favorites';
import { useNearbyCafes } from '@/hooks/useNearbyCafes';
import { fetchNearbyCafes } from '@/lib/places';
import { distanceMeters, formatDistance, regionToRadiusMeters } from '@/lib/geo';
import { openDirections } from '@/lib/directions';
import type { Cafe } from '@/types/cafe';

const SEARCH_HERE_THRESHOLD_METERS = 800;
const SEARCH_DEBOUNCE_MS = 600;

// Sur iOS, un Marker avec tracksViewChanges actif re-capture son rendu en
// continu (coûteux avec 20 pins). On ne le laisse actif que le temps que la
// photo arrive, puis on fige — et on le réactive brièvement quand le badge
// favori change, sinon le pin figé ne refléterait pas le toggle.
function CafeMarker({
  cafe,
  favorite,
  onPress,
}: {
  cafe: Cafe;
  favorite: boolean;
  onPress: NonNullable<ComponentProps<typeof Marker>['onPress']>;
}) {
  const photoUrl = cafe.photoUrls[0];
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [favoriteFlash, setFavoriteFlash] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setFavoriteFlash(true);
    const timer = setTimeout(() => setFavoriteFlash(false), 400);
    return () => clearTimeout(timer);
  }, [favorite]);

  return (
    <Marker
      coordinate={{ latitude: cafe.latitude, longitude: cafe.longitude }}
      tracksViewChanges={(photoUrl ? !photoLoaded : false) || favoriteFlash}
      onPress={onPress}
    >
      <View style={photoUrl ? styles.pinWithPhoto : styles.pin}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.pinPhoto}
            onLoadEnd={() => setPhotoLoaded(true)}
          />
        ) : (
          <Ionicons name="cafe" size={16} color={colors.paper} />
        )}
        {favorite && (
          <View style={styles.pinFavoriteBadge}>
            <Ionicons name="heart" size={9} color={colors.paper} />
          </View>
        )}
      </View>
    </Marker>
  );
}

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { isFavorite } = useFavorites();
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const { cafes: initialCafes, region: initialRegion, loading, error } = useNearbyCafes();

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchCenterRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const searchRadiusRef = useRef<number>(1500);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading) {
      setCafes(initialCafes);
      setActiveTag(null);
      searchCenterRef.current = { latitude: initialRegion.latitude, longitude: initialRegion.longitude };
      searchRadiusRef.current = regionToRadiusMeters(initialRegion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    cafes.forEach((cafe) => cafe.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [cafes]);

  const visibleCafes = useMemo(
    () => (activeTag ? cafes.filter((cafe) => cafe.tags.includes(activeTag)) : cafes),
    [cafes, activeTag]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const searchArea = async (center: { latitude: number; longitude: number }, radiusMeters: number) => {
    setSearching(true);
    setSearchError(null);
    try {
      const results = await fetchNearbyCafes(center.latitude, center.longitude, radiusMeters);
      setCafes(results);
      setActiveTag(null);
      searchCenterRef.current = center;
      searchRadiusRef.current = radiusMeters;
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Impossible de charger les cafés');
    } finally {
      setSearching(false);
    }
  };

  const handleRegionChangeComplete = (nextRegion: MapRegion) => {
    const center = { latitude: nextRegion.latitude, longitude: nextRegion.longitude };
    const radius = regionToRadiusMeters(nextRegion);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const current = searchCenterRef.current;
      const currentRadius = searchRadiusRef.current;
      const movedFar = !current || distanceMeters(current, center) > SEARCH_HERE_THRESHOLD_METERS;
      // Redéclenche aussi la recherche si le niveau de zoom a beaucoup changé
      // (dézoomer sur place ne bouge pas le centre mais doit élargir le rayon).
      const zoomChanged = radius / currentRadius > 1.4 || radius / currentRadius < 0.6;
      if (movedFar || zoomChanged) {
        searchArea(center, radius);
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

  const selectedDistanceLabel =
    selectedCafe && searchCenterRef.current
      ? formatDistance(
          distanceMeters(searchCenterRef.current, {
            latitude: selectedCafe.latitude,
            longitude: selectedCafe.longitude,
          })
        )
      : null;

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
          {visibleCafes.map((cafe) => (
            <CafeMarker
              key={cafe.id}
              cafe={cafe}
              favorite={isFavorite(cafe.id)}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedCafe(cafe);
              }}
            />
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

        {availableTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <Pressable
              style={[styles.chip, shadow.card, !activeTag && styles.chipActive]}
              onPress={() => setActiveTag(null)}
            >
              <Text style={[styles.chipText, !activeTag && styles.chipTextActive]}>Tous</Text>
            </Pressable>
            {availableTags.map((tag) => (
              <Pressable
                key={tag}
                style={[styles.chip, shadow.card, activeTag === tag && styles.chipActive]}
                onPress={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                <Text style={[styles.chipText, activeTag === tag && styles.chipTextActive]}>
                  {tag}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

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
            {selectedCafe.photoUrls[0] ? (
              <Image source={{ uri: selectedCafe.photoUrls[0] }} style={styles.previewIcon} />
            ) : (
              <View style={[styles.previewIcon, styles.previewIconFallback]}>
                <Ionicons name="cafe" size={22} color={colors.paper} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName} numberOfLines={1}>
                {selectedCafe.name}
              </Text>
              {selectedDistanceLabel && (
                <Text style={styles.previewDistance}>{selectedDistanceLabel}</Text>
              )}
            </View>
            {selectedCafe.rating > 0 && (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={12} color={colors.espresso} />
                <Text style={styles.ratingText}>{selectedCafe.rating.toFixed(1)}</Text>
              </View>
            )}

            <FavoriteButton cafe={selectedCafe} />

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
  pinWithPhoto: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.creamDark,
    borderWidth: 2,
    borderColor: colors.paper,
  },
  pinPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: radius.pill,
  },
  pinFavoriteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.paper,
  },
  chipRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.espresso,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.espresso,
  },
  chipTextActive: {
    color: colors.paper,
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
    gap: spacing.sm,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.creamDark,
  },
  previewIconFallback: {
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  previewDistance: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.terracotta,
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

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useNearbyCafes } from '@/hooks/useNearbyCafes';
import { fetchNearbyCafes } from '@/lib/places';
import { destinationPoint, distanceMeters, formatDistance } from '@/lib/geo';
import { CafeCard } from '@/components/ui/CafeCard';
import { Logo } from '@/components/ui/Logo';
import type { Cafe } from '@/types/cafe';

type SortMode = 'rating' | 'distance';

const DISCOVER_RADIUS_METERS = 5000;
// La recherche Google ne pagine pas au-delà de 20 résultats : pour "voir plus",
// on interroge des zones décalées (nord/sud/est/ouest…) plutôt que d'agrandir
// un rayon centré sur le même point, qui renverrait toujours les mêmes cafés.
const LOAD_MORE_SEARCH_RADIUS_METERS = 3000;
const LOAD_MORE_OFFSETS = [
  { bearing: 0, distance: 5000 },
  { bearing: 90, distance: 5000 },
  { bearing: 180, distance: 5000 },
  { bearing: 270, distance: 5000 },
  { bearing: 45, distance: 8000 },
  { bearing: 135, distance: 8000 },
  { bearing: 225, distance: 8000 },
  { bearing: 315, distance: 8000 },
];

export default function DiscoverScreen() {
  const { cafes: initialCafes, region, loading, error } = useNearbyCafes(DISCOVER_RADIUS_METERS);

  // Chaque "lot" (recherche initiale + un par tap sur "Voir plus") garde sa
  // propre position dans la liste : on ne retrie jamais l'ensemble, sinon les
  // cartes déjà affichées sautent de place à chaque chargement.
  const [batches, setBatches] = useState<Cafe[][]>([]);
  const [loadMoreStep, setLoadMoreStep] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('rating');

  useEffect(() => {
    if (!loading) {
      setBatches([initialCafes]);
      setLoadMoreStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const results = await fetchNearbyCafes(region.latitude, region.longitude, DISCOVER_RADIUS_METERS);
      setBatches([results]);
      setLoadMoreStep(0);
    } catch {
      // le prochain onglet Carte remontera l'erreur si la clé/API est en cause
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    const offset = LOAD_MORE_OFFSETS[loadMoreStep];
    if (!offset) return;

    setLoadingMore(true);
    try {
      const center = destinationPoint(region, offset.bearing, offset.distance);
      const results = await fetchNearbyCafes(
        center.latitude,
        center.longitude,
        LOAD_MORE_SEARCH_RADIUS_METERS
      );
      setBatches((current) => {
        const existingIds = new Set(current.flat().map((cafe) => cafe.id));
        const newOnes = results.filter((cafe) => !existingIds.has(cafe.id));
        return newOnes.length > 0 ? [...current, newOnes] : current;
      });
      setLoadMoreStep((step) => step + 1);
    } catch {
      // on garde la liste actuelle si l'élargissement échoue
    } finally {
      setLoadingMore(false);
    }
  };

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    batches.flat().forEach((cafe) => cafe.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [batches]);

  const visibleCafes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const matchesFilters = (cafe: Cafe) => {
      if (activeTag && !cafe.tags.includes(activeTag)) return false;
      if (!normalizedQuery) return true;
      return (
        cafe.name.toLowerCase().includes(normalizedQuery) ||
        cafe.address.toLowerCase().includes(normalizedQuery)
      );
    };

    const withDistance = (cafe: Cafe) => ({
      cafe,
      distance: distanceMeters(region, { latitude: cafe.latitude, longitude: cafe.longitude }),
    });

    return batches.flatMap((batch) =>
      batch
        .filter(matchesFilters)
        .map(withDistance)
        .sort((a, b) => (sortMode === 'rating' ? b.cafe.rating - a.cafe.rating : a.distance - b.distance))
    );
  }, [batches, query, activeTag, sortMode, region]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={visibleCafes}
        keyExtractor={(item) => item.cafe.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.espresso} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Logo size="sm" />
            <Text style={styles.title}>Découvrir</Text>
            <Text style={styles.subtitle}>Les cafés autour de toi</Text>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={colors.inkSoft} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Chercher un café, une adresse…"
                placeholderTextColor={colors.inkSoft}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.inkSoft} />
                </Pressable>
              )}
            </View>

            {availableTags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <Pressable
                  style={[styles.chip, !activeTag && styles.chipActive]}
                  onPress={() => setActiveTag(null)}
                >
                  <Text style={[styles.chipText, !activeTag && styles.chipTextActive]}>Tous</Text>
                </Pressable>
                {availableTags.map((tag) => (
                  <Pressable
                    key={tag}
                    style={[styles.chip, activeTag === tag && styles.chipActive]}
                    onPress={() => setActiveTag(activeTag === tag ? null : tag)}
                  >
                    <Text style={[styles.chipText, activeTag === tag && styles.chipTextActive]}>
                      {tag}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <View style={styles.sortRow}>
              <Pressable
                style={[styles.sortButton, sortMode === 'rating' && styles.sortButtonActive]}
                onPress={() => setSortMode('rating')}
              >
                <Ionicons
                  name="star"
                  size={13}
                  color={sortMode === 'rating' ? colors.paper : colors.espresso}
                />
                <Text style={[styles.sortText, sortMode === 'rating' && styles.sortTextActive]}>
                  Mieux notés
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sortButton, sortMode === 'distance' && styles.sortButtonActive]}
                onPress={() => setSortMode('distance')}
              >
                <Ionicons
                  name="navigate"
                  size={13}
                  color={sortMode === 'distance' ? colors.paper : colors.espresso}
                />
                <Text style={[styles.sortText, sortMode === 'distance' && styles.sortTextActive]}>
                  Plus proches
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.espresso} style={styles.stateSpacing} />
          ) : (
            <Text style={styles.stateText}>
              {error ?? 'Aucun café ne correspond à ta recherche.'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <CafeCard cafe={item.cafe} distanceLabel={formatDistance(item.distance)} />
        )}
        ListFooterComponent={
          visibleCafes.length > 0 ? (
            <View style={styles.footer}>
              {loadMoreStep >= LOAD_MORE_OFFSETS.length ? (
                <Text style={styles.footerText}>Tu as exploré tous les cafés du coin.</Text>
              ) : (
                <Pressable
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={colors.espresso} />
                  ) : (
                    <>
                      <Ionicons name="add" size={16} color={colors.espresso} />
                      <Text style={styles.loadMoreText}>Voir plus de cafés</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  listContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.ink,
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  chipRow: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.espresso,
    borderColor: colors.espresso,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.espresso,
  },
  chipTextActive: {
    color: colors.paper,
  },
  sortRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  sortButtonActive: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  sortText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.espresso,
  },
  sortTextActive: {
    color: colors.paper,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  loadMoreText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.espresso,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  stateSpacing: {
    marginTop: spacing.xl,
  },
  stateText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

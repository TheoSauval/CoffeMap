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
import { distanceMeters, formatDistance } from '@/lib/geo';
import { CafeCard } from '@/components/ui/CafeCard';
import { Logo } from '@/components/ui/Logo';
import type { Cafe } from '@/types/cafe';

type SortMode = 'rating' | 'distance';

export default function DiscoverScreen() {
  const { cafes: initialCafes, region, loading, error } = useNearbyCafes();

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('rating');

  useEffect(() => {
    if (!loading) setCafes(initialCafes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const results = await fetchNearbyCafes(region.latitude, region.longitude);
      setCafes(results);
    } catch {
      // le prochain onglet Carte remontera l'erreur si la clé/API est en cause
    } finally {
      setRefreshing(false);
    }
  };

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    cafes.forEach((cafe) => cafe.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [cafes]);

  const visibleCafes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const withDistance = cafes
      .filter((cafe) => !activeTag || cafe.tags.includes(activeTag))
      .filter((cafe) => {
        if (!normalizedQuery) return true;
        return (
          cafe.name.toLowerCase().includes(normalizedQuery) ||
          cafe.address.toLowerCase().includes(normalizedQuery)
        );
      })
      .map((cafe) => ({
        cafe,
        distance: distanceMeters(region, { latitude: cafe.latitude, longitude: cafe.longitude }),
      }));

    withDistance.sort((a, b) =>
      sortMode === 'rating' ? b.cafe.rating - a.cafe.rating : a.distance - b.distance
    );

    return withDistance;
  }, [cafes, query, activeTag, sortMode, region]);

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

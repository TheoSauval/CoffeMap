import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import { fetchPlaceDetails } from '@/lib/places';
import { openDirections } from '@/lib/directions';
import type { CafeDetails } from '@/types/cafeDetails';

export default function CafeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [cafe, setCafe] = useState<CafeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const details = await fetchPlaceDetails(id);
        if (!cancelled) setCafe(details);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger ce café');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.espresso} size="large" />
        </View>
      ) : error || !cafe ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Café introuvable'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {cafe.photoUrls.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {cafe.photoUrls.map((url) => (
                <Image key={url} source={{ uri: url }} style={styles.heroPhoto} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroPhoto, styles.heroPlaceholder]}>
              <Ionicons name="cafe" size={48} color={colors.paper} />
            </View>
          )}

          <View style={styles.content}>
            <Text style={styles.name}>{cafe.name}</Text>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.espresso} />
              <Text style={styles.ratingText}>{cafe.rating.toFixed(1)}</Text>
              {cafe.userRatingCount != null && (
                <Text style={styles.ratingCount}>({cafe.userRatingCount} avis)</Text>
              )}
            </View>

            <Text style={styles.address}>{cafe.address}</Text>

            {cafe.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {cafe.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actionsRow}>
              <Pressable style={styles.primaryAction} onPress={() => openDirections(cafe)}>
                <Ionicons name="navigate" size={18} color={colors.paper} />
                <Text style={styles.primaryActionText}>Itinéraire</Text>
              </Pressable>

              {cafe.phone && (
                <Pressable
                  style={styles.secondaryAction}
                  onPress={() => Linking.openURL(`tel:${cafe.phone}`)}
                >
                  <Ionicons name="call" size={18} color={colors.espresso} />
                  <Text style={styles.secondaryActionText}>Appeler</Text>
                </Pressable>
              )}

              {cafe.website && (
                <Pressable style={styles.secondaryAction} onPress={() => Linking.openURL(cafe.website!)}>
                  <Ionicons name="globe-outline" size={18} color={colors.espresso} />
                  <Text style={styles.secondaryActionText}>Site</Text>
                </Pressable>
              )}
            </View>

            {cafe.openingHours && cafe.openingHours.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Horaires</Text>
                {cafe.openingHours.map((line) => (
                  <Text key={line} style={styles.hoursLine}>
                    {line}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <SafeAreaView style={styles.backOverlay} edges={['top']} pointerEvents="box-none">
        <Pressable style={[styles.backButton, shadow.card]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.espresso} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const HERO_HEIGHT = 280;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  heroPhoto: {
    width: 393,
    height: HERO_HEIGHT,
    backgroundColor: colors.creamDark,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.espresso,
  },
  content: {
    padding: spacing.lg,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  ratingText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.espresso,
  },
  ratingCount: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  address: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.md,
  },
  tag: {
    backgroundColor: colors.creamDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: fonts.accent,
    fontSize: 12,
    color: colors.espresso,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.espresso,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  primaryActionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.paper,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.creamDark,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  secondaryActionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.espresso,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  hoursLine: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 2,
  },
  backOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

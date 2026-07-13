import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import type { Cafe } from '@/types/cafe';

export function CafeCard({ cafe }: { cafe: Cafe }) {
  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.thumb}>
        <Ionicons name="cafe" size={28} color={colors.paper} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {cafe.name}
          </Text>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color={colors.espresso} />
            <Text style={styles.ratingText}>{cafe.rating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.tagline} numberOfLines={1}>
          {cafe.tagline}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {cafe.address}
        </Text>

        <View style={styles.tagsRow}>
          {cafe.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.ink,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.latte,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 4,
  },
  ratingText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.espresso,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  address: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    opacity: 0.8,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.creamDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    fontFamily: fonts.accent,
    fontSize: 11,
    color: colors.espresso,
  },
});

import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius } from '@/constants/theme';
import { useFavorites } from '@/lib/favorites';
import type { Cafe } from '@/types/cafe';

export function FavoriteButton({
  cafe,
  size = 18,
  style,
}: {
  cafe: Cafe;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(cafe.id);

  return (
    <Pressable
      style={[styles.button, style]}
      hitSlop={8}
      onPress={(e) => {
        e.stopPropagation();
        toggleFavorite(cafe);
      }}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? colors.terracotta : colors.espresso}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

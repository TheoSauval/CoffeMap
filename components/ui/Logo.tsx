import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type LogoProps = {
  size?: 'sm' | 'lg';
};

export function Logo({ size = 'lg' }: LogoProps) {
  const isLarge = size === 'lg';

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, isLarge ? styles.titleLg : styles.titleSm]}>
        coffee<Text style={styles.titleAccent}>map</Text>
      </Text>
      {isLarge && <Text style={styles.subtitle}>CAFÉ · CARTE · COMMUNAUTÉ</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: fonts.display,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  titleLg: {
    fontSize: 40,
  },
  titleSm: {
    fontSize: 22,
  },
  titleAccent: {
    color: colors.terracotta,
  },
  subtitle: {
    fontFamily: fonts.accent,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.inkSoft,
    marginTop: 2,
  },
});

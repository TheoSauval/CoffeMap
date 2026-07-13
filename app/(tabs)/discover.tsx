import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '@/constants/theme';
import { useNearbyCafes } from '@/hooks/useNearbyCafes';
import { CafeCard } from '@/components/ui/CafeCard';
import { Logo } from '@/components/ui/Logo';

export default function DiscoverScreen() {
  const { cafes, loading, error } = useNearbyCafes();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={cafes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Logo size="sm" />
            <Text style={styles.title}>Découvrir</Text>
            <Text style={styles.subtitle}>Les cafés les mieux notés autour de toi</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.espresso} style={styles.stateSpacing} />
          ) : (
            <Text style={styles.stateText}>
              {error ?? 'Aucun café trouvé autour de toi pour le moment.'}
            </Text>
          )
        }
        renderItem={({ item }) => <CafeCard cafe={item} />}
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

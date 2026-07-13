import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '@/constants/theme';
import { mockCafes } from '@/constants/mockCafes';
import { CafeCard } from '@/components/ui/CafeCard';
import { Logo } from '@/components/ui/Logo';

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={mockCafes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Logo size="sm" />
            <Text style={styles.title}>Découvrir</Text>
            <Text style={styles.subtitle}>Les cafés les mieux notés autour de toi</Text>
          </View>
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
});

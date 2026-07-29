import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '@/constants/theme';
import { CafeCard } from '@/components/ui/CafeCard';
import { useVisited } from '@/lib/visited';

export default function VisitedScreen() {
  const router = useRouter();
  const { visited, loading } = useVisited();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={visited}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={colors.espresso} />
            </Pressable>
            <Text style={styles.title}>Mes cafés visités</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.espresso} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-done-outline" size={32} color={colors.espresso} />
              </View>
              <Text style={styles.emptyTitle}>Aucun café visité pour l'instant</Text>
              <Text style={styles.emptyText}>
                Marque un café comme visité depuis sa fiche pour tenir ton carnet de bord ici.
              </Text>
            </View>
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
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 19,
  },
});

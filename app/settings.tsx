import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.back();
  };

  const confirmDelete = () => {
    Alert.alert(
      'Supprimer ton compte ?',
      'Cette action est définitive : ton compte, tes favoris et tes recettes seront supprimés. Impossible de revenir en arrière.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error } = await deleteAccount();
            setDeleting(false);
            if (error) Alert.alert('Erreur', error);
            else router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.espresso} />
        </Pressable>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      {user?.email && (
        <View style={styles.accountSection}>
          <Text style={styles.accountLabel}>Compte</Text>
          <Text style={styles.accountEmail}>{user.email}</Text>
        </View>
      )}

      <View style={styles.menu}>
        <Pressable style={[styles.menuItem, shadow.card]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.menuLabel, { color: colors.danger }]}>Se déconnecter</Text>
        </Pressable>

        <Pressable
          style={[styles.menuItem, shadow.card]}
          onPress={confirmDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          )}
          <Text style={[styles.menuLabel, { color: colors.danger }]}>Supprimer mon compte</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
  },
  accountSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountLabel: {
    fontFamily: fonts.accent,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.inkSoft,
    textTransform: 'uppercase',
  },
  accountEmail: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
    marginTop: 4,
  },
  menu: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.paper,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  menuLabel: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
});

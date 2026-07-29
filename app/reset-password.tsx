import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { user, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = password.length >= MIN_PASSWORD_LENGTH && passwordsMatch;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const { error: authError } = await updatePassword(password);
    setSubmitting(false);
    if (authError) setError(authError);
    else router.replace('/(tabs)/profile');
  };

  // Le lien de réinitialisation ouvre une vraie session : abandonner sans
  // choisir de mot de passe doit donc déconnecter, pas laisser l'accès ouvert.
  const handleCancel = async () => {
    await signOut();
    router.replace('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Nouveau mot de passe</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="lock-closed-outline" size={28} color={colors.espresso} />
        </View>

        <Text style={styles.cardTitle}>Choisis ton nouveau mot de passe</Text>
        <Text style={styles.cardSubtitle}>
          {user?.email
            ? `Il remplacera l'ancien pour ${user.email}.`
            : 'Il remplacera immédiatement l’ancien.'}
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={`Nouveau mot de passe (${MIN_PASSWORD_LENGTH} caractères min.)`}
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          secureTextEntry
          autoComplete="new-password"
          autoFocus
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirme le mot de passe"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          secureTextEntry
          autoComplete="new-password"
        />

        {tooShort && (
          <Text style={styles.errorText}>
            Le mot de passe doit faire au moins {MIN_PASSWORD_LENGTH} caractères.
          </Text>
        )}
        {confirmPassword.length > 0 && !passwordsMatch && (
          <Text style={styles.errorText}>Les mots de passe ne correspondent pas.</Text>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={colors.paper} size="small" />
          ) : (
            <Text style={styles.submitText}>Enregistrer</Text>
          )}
        </Pressable>

        <Pressable onPress={handleCancel} hitSlop={8} disabled={submitting}>
          <Text style={styles.cancelText}>Annuler</Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.ink,
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 19,
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.danger,
  },
  submitButton: {
    backgroundColor: colors.espresso,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.paper,
  },
  cancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

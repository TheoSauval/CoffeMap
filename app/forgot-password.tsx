import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    setSending(true);
    setError(null);
    const { error: authError } = await sendPasswordReset(trimmed);
    setSending(false);
    if (authError) setError(authError);
    else setSentTo(trimmed);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.espresso} />
        </Pressable>
        <Text style={styles.title}>Mot de passe</Text>
      </View>

      <View style={styles.card}>
        {sentTo ? (
          <>
            <View style={styles.icon}>
              <Ionicons name="mail-outline" size={28} color={colors.espresso} />
            </View>
            <Text style={styles.cardTitle}>Vérifie ta boîte mail</Text>
            <Text style={styles.cardSubtitle}>
              Si un compte existe pour {sentTo}, on vient d'y envoyer un lien pour choisir un
              nouveau mot de passe. Ouvre-le depuis cet appareil.
            </Text>
            <Pressable style={styles.submitButton} onPress={() => router.back()}>
              <Text style={styles.submitText}>Revenir à la connexion</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>Mot de passe oublié ?</Text>
            <Text style={styles.cardSubtitle}>
              Indique ton adresse email : on t'envoie un lien pour en choisir un nouveau.
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Adresse email"
              placeholderTextColor={colors.inkSoft}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              autoFocus
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={[styles.submitButton, !email.trim() && styles.submitButtonDisabled]}
              onPress={handleSend}
              disabled={sending || !email.trim()}
            >
              {sending ? (
                <ActivityIndicator color={colors.paper} size="small" />
              ) : (
                <Text style={styles.submitText}>Envoyer le lien</Text>
              )}
            </Pressable>
          </>
        )}
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
});

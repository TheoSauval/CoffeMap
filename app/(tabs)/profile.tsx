import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import type { User } from '@supabase/supabase-js';

import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth';

const MENU_ITEMS = [
  { icon: 'cafe-outline', label: 'Mes cafés visités', route: '/visited' },
  { icon: 'settings-outline', label: 'Paramètres', route: '/settings' },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, initializing, configured } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Logo size="sm" />
        <Text style={styles.title}>Profil</Text>
      </View>

      {!configured && (
        <View style={styles.configWarning}>
          <Ionicons name="warning-outline" size={16} color={colors.danger} />
          <Text style={styles.configWarningText}>
            Supabase n'est pas configuré (EXPO_PUBLIC_SUPABASE_URL / ANON_KEY manquants dans .env).
          </Text>
        </View>
      )}

      {initializing ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.espresso} />
        </View>
      ) : user ? (
        <SignedInView user={user} />
      ) : (
        <AuthForm />
      )}

      {/* Accessible avec ou sans compte : les stores exigent que ces documents
          soient consultables sans avoir à s'inscrire. */}
      <View style={styles.legalRow}>
        <Pressable onPress={() => router.push('/legal/terms')} hitSlop={8}>
          <Text style={styles.legalLink}>Conditions d'utilisation</Text>
        </Pressable>
        <Text style={styles.legalSeparator}>·</Text>
        <Pressable onPress={() => router.push('/legal/privacy')} hitSlop={8}>
          <Text style={styles.legalLink}>Confidentialité</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SignedInView({ user }: { user: User }) {
  const router = useRouter();
  const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
  const email = user.email ?? '';
  const displayName = fullName || email;
  const initial = displayName.charAt(0).toUpperCase() || '?';

  return (
    <>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{fullName ? email : 'Connecté'}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.label}
            style={[styles.menuItem, shadow.card]}
            onPress={() => router.push(item.route)}
          >
            <Ionicons name={item.icon} size={20} color={colors.espresso} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
          </Pressable>
        ))}
      </View>
    </>
  );
}

function AuthForm() {
  const router = useRouter();
  const { signInWithPassword, signUpWithPassword, signInWithOAuth } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const termsScale = useRef(new Animated.Value(1)).current;

  const toggleTerms = () => {
    const next = !acceptedTerms;
    setAcceptedTerms(next);
    if (next) {
      termsScale.setValue(0.7);
      Animated.spring(termsScale, {
        toValue: 1,
        friction: 3,
        tension: 160,
        useNativeDriver: true,
      }).start();
    }
  };

  const isSignup = mode === 'signup';
  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    Boolean(email.trim()) &&
    Boolean(password) &&
    (!isSignup || (Boolean(fullName.trim()) && passwordsMatch && acceptedTerms));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    if (isSignup) {
      const { error: authError, needsConfirmation } = await signUpWithPassword(
        email.trim(),
        password,
        fullName.trim()
      );
      setSubmitting(false);
      if (authError) setError(authError);
      else if (needsConfirmation) setConfirmationSentTo(email.trim());
    } else {
      const { error: authError } = await signInWithPassword(email.trim(), password);
      setSubmitting(false);
      if (authError) setError(authError);
    }
  };

  const handleOAuth = async (provider: 'apple' | 'google') => {
    setOauthLoading(provider);
    setError(null);
    const { error: authError } = await signInWithOAuth(provider);
    setOauthLoading(null);
    if (authError) setError(authError);
  };

  if (confirmationSentTo) {
    return (
      <View style={styles.authCard}>
        <View style={styles.confirmIcon}>
          <Ionicons name="mail-outline" size={28} color={colors.espresso} />
        </View>
        <Text style={styles.authTitle}>Vérifie ta boîte mail</Text>
        <Text style={styles.authSubtitle}>
          On a envoyé un lien de confirmation à {confirmationSentTo}. Clique dessus pour activer
          ton compte, puis reviens te connecter ici.
        </Text>
        <Pressable
          style={styles.submitButton}
          onPress={() => {
            setConfirmationSentTo(null);
            setMode('signin');
            setPassword('');
          }}
        >
          <Text style={styles.submitText}>Revenir à la connexion</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.authCard}>
      <Text style={styles.authTitle}>
        {mode === 'signin' ? 'Connecte-toi' : 'Crée ton compte'}
      </Text>
      <Text style={styles.authSubtitle}>Pour synchroniser tes favoris et tes recettes.</Text>

      {isSignup && (
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nom et prénom"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          autoComplete="name"
        />
      )}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Adresse email"
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mot de passe"
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
        secureTextEntry
        autoComplete="password"
      />
      {isSignup && (
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirme le mot de passe"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          secureTextEntry
          autoComplete="password"
        />
      )}
      {isSignup && confirmPassword.length > 0 && !passwordsMatch && (
        <Text style={styles.errorText}>Les mots de passe ne correspondent pas.</Text>
      )}

      {isSignup && (
        <View style={styles.termsRow}>
          <Pressable onPress={toggleTerms} hitSlop={8}>
            <Animated.View style={{ transform: [{ scale: termsScale }] }}>
              <Ionicons
                name={acceptedTerms ? 'checkbox' : 'square-outline'}
                size={20}
                color={acceptedTerms ? colors.terracotta : colors.inkSoft}
              />
            </Animated.View>
          </Pressable>
          <Text style={styles.termsText}>
            <Text onPress={toggleTerms}>J'accepte les </Text>
            <Text style={styles.termsLink} onPress={() => router.push('/legal/terms')}>
              conditions d'utilisation
            </Text>
            <Text onPress={toggleTerms}> et la </Text>
            <Text style={styles.termsLink} onPress={() => router.push('/legal/privacy')}>
              politique de confidentialité
            </Text>
          </Text>
        </View>
      )}

      {!isSignup && (
        <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8}>
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </Pressable>
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
          <Text style={styles.submitText}>
            {mode === 'signin' ? 'Se connecter' : "S'inscrire"}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError(null);
          setFullName('');
          setConfirmPassword('');
          setAcceptedTerms(false);
        }}
        hitSlop={8}
      >
        <Text style={styles.switchModeText}>
          {mode === 'signin'
            ? "Pas encore de compte ? S'inscrire"
            : 'Déjà un compte ? Se connecter'}
        </Text>
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={[styles.oauthButton, styles.appleButton]}
        onPress={() => handleOAuth('apple')}
        disabled={oauthLoading !== null}
      >
        {oauthLoading === 'apple' ? (
          <ActivityIndicator color={colors.paper} size="small" />
        ) : (
          <>
            <Ionicons name="logo-apple" size={18} color={colors.paper} />
            <Text style={styles.oauthTextLight}>Continuer avec Apple</Text>
          </>
        )}
      </Pressable>

      <Pressable
        style={[styles.oauthButton, styles.googleButton]}
        onPress={() => handleOAuth('google')}
        disabled={oauthLoading !== null}
      >
        {oauthLoading === 'google' ? (
          <ActivityIndicator color={colors.espresso} size="small" />
        ) : (
          <>
            <Ionicons name="logo-google" size={18} color={colors.espresso} />
            <Text style={styles.oauthTextDark}>Continuer avec Google</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 'auto',
    paddingVertical: spacing.lg,
  },
  legalLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.ink,
    marginTop: spacing.md,
  },
  configWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#F5DCD8',
    borderRadius: radius.md,
  },
  configWarningText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.danger,
    lineHeight: 15,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    color: colors.paper,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.ink,
  },
  email: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
    maxWidth: 220,
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
  authCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  authTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.ink,
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  authSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
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
  forgotText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'right',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  termsText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 18,
  },
  termsLink: {
    fontFamily: fonts.bodyMedium,
    color: colors.terracotta,
    textDecorationLine: 'underline',
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
  switchModeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.terracotta,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingVertical: 12,
  },
  appleButton: {
    backgroundColor: colors.ink,
  },
  googleButton: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  oauthTextLight: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.paper,
  },
  oauthTextDark: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.espresso,
  },
});

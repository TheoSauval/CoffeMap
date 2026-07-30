import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import type { Session, User } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from './supabase';
import { describeAuthError } from './errors';

WebBrowser.maybeCompleteAuthSession();

type AuthResult = { error: string | null; needsConfirmation?: boolean };
type OAuthProvider = 'apple' | 'google';

// Utilisé par le retour OAuth (Apple/Google), le lien de confirmation d'email
// et le lien de réinitialisation de mot de passe — tous redirigent vers
// coffeemap://auth/callback avec un access_token/refresh_token dans l'URL.
// Renvoie null si l'URL ne contient pas de session (ex: un deep link sans
// rapport). `recovery` distingue le lien de reset : il ouvre bien une session
// valide, mais l'utilisateur doit encore choisir son nouveau mot de passe.
async function trySetSessionFromUrl(
  url: string
): Promise<(AuthResult & { recovery: boolean }) | null> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) return { error: describeAuthError(errorCode), recovery: false };

  const { access_token, refresh_token, type } = params;
  if (!access_token || !refresh_token) return null;

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  return {
    error: error ? describeAuthError(error.message) : null,
    recovery: type === 'recovery',
  };
}

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  configured: boolean;
  // Vrai entre l'ouverture d'un lien de réinitialisation et le choix effectif
  // du nouveau mot de passe — voir RecoveryGate dans app/_layout.tsx.
  recovering: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setInitializing(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Capte le retour du lien de confirmation d'email (ouvert depuis l'app
    // Mail, donc l'app peut être froide ou déjà au premier plan).
    const handleUrl = async (url: string) => {
      const result = await trySetSessionFromUrl(url);
      if (result?.recovery) setRecovering(true);
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url).catch((err) => console.warn('Lien email : session invalide', err));
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url).catch(() => {});
    });

    return () => subscription.remove();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      initializing,
      configured: isSupabaseConfigured,
      recovering,

      signInWithPassword: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? describeAuthError(error.message) : null };
      },

      signUpWithPassword: async (email, password, fullName) => {
        const emailRedirectTo = Linking.createURL('auth/callback');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo },
        });
        if (error) return { error: describeAuthError(error.message) };
        // Si la confirmation par email est activée sur le projet Supabase,
        // signUp ne renvoie pas de session tant que le lien n'a pas été cliqué.
        return { error: null, needsConfirmation: !data.session };
      },

      signInWithOAuth: async (provider) => {
        const redirectTo = Linking.createURL('auth/callback');
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) return { error: describeAuthError(error.message) };
        if (!data?.url) return { error: 'Lien de connexion introuvable' };

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'cancel' || result.type === 'dismiss') {
          return { error: null };
        }
        if (result.type !== 'success' || !result.url) {
          return { error: 'La connexion a échoué' };
        }

        const sessionResult = await trySetSessionFromUrl(result.url);
        return sessionResult ?? { error: 'Session introuvable' };
      },

      sendPasswordReset: async (email) => {
        // Même URL de retour que la confirmation d'email : elle est déjà
        // autorisée côté Supabase, et `type=recovery` suffit à distinguer.
        const redirectTo = Linking.createURL('auth/callback');
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        return { error: error ? describeAuthError(error.message) : null };
      },

      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { error: describeAuthError(error.message) };
        setRecovering(false);
        return { error: null };
      },

      signOut: async () => {
        setRecovering(false);
        await supabase.auth.signOut();
      },

      deleteAccount: async () => {
        const { error } = await supabase.rpc('delete_user');
        if (error) return { error: describeAuthError(error.message) };
        await supabase.auth.signOut();
        return { error: null };
      },
    }),
    [session, initializing, recovering]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

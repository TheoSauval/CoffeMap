import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts as useCustomFonts } from 'expo-font';
import {
  useFonts as useAnton,
  Anton_400Regular,
} from '@expo-google-fonts/anton';
import {
  useFonts as useFredoka,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  useFonts as usePoppins,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';

import { colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { FavoritesProvider } from '@/lib/favorites';
import { RecipesProvider } from '@/lib/recipes';
import { VisitedProvider } from '@/lib/visited';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Le lien « mot de passe oublié » ouvre une session valide n'importe où dans
// l'app : sans ça, l'utilisateur se retrouverait simplement connecté sans
// jamais choisir son nouveau mot de passe.
function RecoveryGate() {
  const { recovering } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (recovering) router.push('/reset-password');
  }, [recovering, router]);

  return null;
}

export default function RootLayout() {
  const [antonLoaded] = useAnton({ Anton_400Regular });
  const [fredokaLoaded] = useFredoka({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });
  const [poppinsLoaded] = usePoppins({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });
  const [customLoaded] = useCustomFonts({
    BricolageGrotesqueExtraBold: require('@/assets/fonts/BricolageGrotesque-ExtraBold.ttf'),
  });

  const fontsLoaded = antonLoaded && fredokaLoaded && poppinsLoaded && customLoaded;

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <FavoritesProvider>
        <VisitedProvider>
          <RecipesProvider>
            <View style={{ flex: 1, backgroundColor: colors.cream }} onLayout={onLayoutRootView}>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="cafe/[id]" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="visited" />
                <Stack.Screen name="forgot-password" />
                <Stack.Screen name="reset-password" options={{ gestureEnabled: false }} />
                <Stack.Screen name="legal/terms" />
                <Stack.Screen name="legal/privacy" />
              </Stack>
              <RecoveryGate />
            </View>
          </RecipesProvider>
        </VisitedProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}

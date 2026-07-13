/**
 * Palette et typographies de CoffeeMap.
 * Inspiré d'affiches de café vintage : fond crème/papier, encre noire,
 * accents caramel/terracotta. À ajuster quand d'autres visuels arrivent.
 */

export const colors = {
  // Fonds
  cream: '#F5EAD6',
  creamDark: '#EBDBBB',
  paper: '#FBF4E7',

  // Textes / encre
  ink: '#241811',
  inkSoft: '#4A392C',

  // Marque
  espresso: '#3A2418',
  espressoLight: '#5C3A25',
  caramel: '#C9793F',
  terracotta: '#B85C38',
  latte: '#DAB88B',

  // Utilitaires
  border: '#E2CFA6',
  white: '#FFFFFF',
  success: '#5C7A4F',
  danger: '#B84C3F',
} as const;

export const fonts = {
  // Titres / logo — display bold, esprit affiche de café
  display: 'Anton_400Regular',
  // Accents, tags, boutons, taglines — rond et chaleureux
  accent: 'Fredoka_600SemiBold',
  accentBold: 'Fredoka_700Bold',
  // Corps de texte — lisible et propre
  body: 'Poppins_400Regular',
  bodyMedium: 'Poppins_500Medium',
  bodySemiBold: 'Poppins_600SemiBold',
  // Test — Bricolage Grotesque (Google Fonts, OFL, libre d'usage commercial).
  bricolageTest: 'BricolageGrotesqueExtraBold',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const shadow = {
  card: {
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
} as const;

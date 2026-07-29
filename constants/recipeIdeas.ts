// Idées de recettes proposées par l'app dans Mon café — contenu statique
// (pas de backend dédié), affiché en carrousel pour inspirer avant de créer
// sa propre recette. Chaque quantité et chaque étape sur sa propre ligne.
export const RECIPE_IDEAS = [
  {
    title: 'Cold brew maison',
    tagline: 'Infusion à froid, 12h',
    notes:
      "100 g de café moulu grossièrement\n1 L d'eau froide\n\nMélanger et laisser infuser 12 à 18h au frigo.\nFiltrer, puis diluer avec de l'eau ou du lait selon le goût.",
    icon: 'snow-outline',
  },
  {
    title: 'Café dalgona',
    tagline: 'Mousse fouettée à la coréenne',
    notes:
      "2 c. à s. de café soluble\n2 c. à s. de sucre\n2 c. à s. d'eau chaude\n\nFouetter 3 à 5 minutes jusqu'à obtenir une mousse épaisse.\nDéposer sur un verre de lait chaud ou glacé.",
    icon: 'sparkles-outline',
  },
  {
    title: 'Flat white',
    tagline: 'Espresso serré, lait velouté',
    notes:
      "1 double espresso\nLait entier texturé\n\nTirer le double espresso.\nTexturer le lait pour une micro-mousse fine, sans trop de bulles.\nVerser sur l'espresso en un geste continu.",
    icon: 'cafe-outline',
  },
  {
    title: 'Affogato',
    tagline: "Glace vanille noyée d'espresso",
    notes:
      '1 boule de glace vanille\n1 espresso chaud\n\nDéposer la glace dans une petite tasse.\nVerser l\'espresso chaud dessus juste avant de servir.\nDéguster immédiatement.',
    icon: 'ice-cream-outline',
  },
  {
    title: 'Café glacé à la cannelle',
    tagline: 'Rafraîchissant et épicé',
    notes:
      'Un café fort\nGlaçons\nLait\nUne pincée de cannelle\n\nPréparer le café fort et laisser refroidir.\nVerser sur les glaçons, ajouter le lait et la cannelle.\nSucrer au sirop si besoin.',
    icon: 'snow-outline',
  },
  {
    title: 'Latte caramel maison',
    tagline: 'Doux et gourmand',
    notes:
      '1 espresso\nLait chaud texturé\n1 à 2 c. à s. de sauce caramel\n\nVerser la sauce caramel au fond du verre.\nAjouter l\'espresso et mélanger.\nVerser le lait chaud texturé.\nTerminer par un filet de caramel dessus.',
    icon: 'flame-outline',
  },
] as const;

export type RecipeIdea = (typeof RECIPE_IDEAS)[number];

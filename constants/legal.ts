/**
 * Métadonnées des documents légaux (CGU + politique de confidentialité).
 *
 * ⚠️ À COMPLÉTER avant toute publication sur les stores. Les valeurs marquées
 * `À COMPLÉTER` s'affichent telles quelles dans l'app — elles sont volontairement
 * visibles pour qu'un oubli saute aux yeux en relecture.
 *
 * ⚠️ Ces textes sont un brouillon rédigé à partir du fonctionnement réel de
 * l'app. Ils n'ont pas valeur de conseil juridique et doivent être relus par
 * un professionnel (RGPD, droit de la consommation) avant mise en ligne.
 */

export const legal = {
  /** Nom de la personne ou société qui édite l'app (mentions légales). */
  editor: '[À COMPLÉTER : nom de l’éditeur]',
  /** Adresse postale de l'éditeur — obligatoire en mentions légales françaises. */
  editorAddress: '[À COMPLÉTER : adresse postale]',
  /** Adresse de contact pour les demandes RGPD et le support. */
  contactEmail: '[À COMPLÉTER : email de contact]',
  /** Hébergeur des données applicatives (Supabase) et région du projet. */
  host: 'Supabase Inc.',
  hostRegion: '[À COMPLÉTER : région du projet Supabase, ex. Europe (Francfort)]',
  /** Date de dernière mise à jour, affichée en tête des deux documents. */
  lastUpdated: '29 juillet 2026',
} as const;

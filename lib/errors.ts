/**
 * Traduction des pannes techniques en messages affichables.
 *
 * Principe : le `message` d'une PlacesError est déjà rédigé pour l'utilisateur,
 * et le détail technique (corps de réponse, code) part dans la console. Un
 * écran qui affiche `error.message` ne peut donc pas laisser fuiter du JSON.
 */

const GENERIC = 'Une erreur est survenue. Réessaie dans un instant.';
const OFFLINE = 'Pas de connexion internet. Vérifie ton réseau et réessaie.';
const UNAVAILABLE = 'La recherche de cafés est momentanément indisponible.';

export class PlacesError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'PlacesError';
    this.status = status;
  }
}

/** Panne réseau : `fetch` rejette sans réponse HTTP. */
export function offlineError(cause: unknown): PlacesError {
  console.warn('Places : requête réseau échouée', cause);
  return new PlacesError(OFFLINE);
}

/** Clé API absente : problème de configuration, invisible pour l'utilisateur. */
export function configError(): PlacesError {
  console.warn(
    'EXPO_PUBLIC_GOOGLE_PLACES_API_KEY manquante — renseigne-la dans .env puis relance Metro'
  );
  return new PlacesError(UNAVAILABLE);
}

/** Réponse HTTP en erreur : on ne montre jamais le corps renvoyé par Google. */
export function httpError(status: number, body: string): PlacesError {
  console.warn(`Places : réponse ${status}`, body);

  if (status === 404) {
    return new PlacesError("Ce café n'est plus référencé.", status);
  }
  if (status === 429) {
    return new PlacesError('Trop de recherches en peu de temps. Réessaie dans un instant.', status);
  }
  // 401/403 : clé invalide, restreinte ou facturation désactivée. Rien que
  // l'utilisateur puisse corriger — on reste vague plutôt qu'alarmant.
  if (status === 401 || status === 403) {
    return new PlacesError(UNAVAILABLE, status);
  }
  if (status >= 500) {
    return new PlacesError('Le service de recherche est momentanément indisponible.', status);
  }
  return new PlacesError(UNAVAILABLE, status);
}

/**
 * Message affichable pour une erreur quelconque. Seules les PlacesError ont un
 * message déjà rédigé ; tout le reste (position, imprévu) tombe sur un texte
 * générique pour éviter d'afficher une chaîne technique en anglais.
 */
export function toUserMessage(err: unknown, fallback: string = GENERIC): string {
  if (err instanceof PlacesError) return err.message;
  console.warn('Erreur non catégorisée', err);
  return fallback;
}

// Supabase renvoie ses erreurs en anglais et sans code stable : on reconnaît
// les cas courants sur le texte, en retombant sur un message neutre sinon.
const AUTH_MESSAGES: { match: RegExp; message: string }[] = [
  { match: /invalid login credentials/i, message: 'Email ou mot de passe incorrect.' },
  {
    match: /email not confirmed/i,
    message: "Ton adresse email n'est pas encore confirmée. Ouvre le lien reçu par email.",
  },
  {
    match: /user already registered|already been registered/i,
    message: 'Un compte existe déjà avec cette adresse email.',
  },
  {
    match: /password should be at least/i,
    message: 'Le mot de passe doit faire au moins 6 caractères.',
  },
  {
    match: /new password should be different/i,
    message: "Le nouveau mot de passe doit être différent de l'ancien.",
  },
  {
    match: /unable to validate email|invalid format/i,
    message: 'Cette adresse email est invalide.',
  },
  {
    match: /for security purposes|rate limit|too many requests/i,
    message: 'Trop de tentatives. Patiente quelques instants avant de réessayer.',
  },
  { match: /network request failed|fetch failed/i, message: OFFLINE },
];

export function describeAuthError(raw: string | undefined): string {
  if (!raw) return GENERIC;
  const known = AUTH_MESSAGES.find((entry) => entry.match.test(raw));
  if (known) return known.message;
  console.warn('Auth : message non traduit', raw);
  return "La connexion a échoué. Réessaie dans un instant.";
}

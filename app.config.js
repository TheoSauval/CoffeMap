// Config dynamique : elle reçoit app.json et l'enrichit au moment du build.
//
// La carte Android passe par le SDK Google Maps, qui exige sa clé dans le
// manifeste natif. app.json étant versionné, la clé ne peut pas y figurer :
// elle vient de .env (non versionné). À défaut d'une clé dédiée, on réutilise
// celle de Places — pense à les séparer le jour où tu restreindras les clés
// par plateforme dans Google Cloud.
const androidMapsApiKey =
  process.env.GOOGLE_MAPS_ANDROID_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: androidMapsApiKey },
    },
  },
});

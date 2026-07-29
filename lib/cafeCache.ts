import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchCafeSnapshot, materializeCafe, type CafeSnapshot } from './places';
import type { Cafe } from '@/types/cafe';

const CACHE_KEY = 'coffeemap:places:v1';

// Les conditions de Google Maps Platform n'autorisent à conserver durablement
// que l'identifiant du lieu ; le contenu de la fiche ne peut être mis en cache
// que temporairement (30 jours au maximum). Passé ce délai on recharge, ce qui
// évite aussi d'afficher indéfiniment des horaires ou une adresse obsolètes.
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Entry = { snapshot: CafeSnapshot; cachedAt: number };
type CacheMap = Record<string, Entry>;

async function readCache(): Promise<CacheMap> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: CacheMap) {
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache)).catch(() => {});
}

/**
 * Transforme une liste d'identifiants de lieux en fiches affichables, en
 * s'appuyant sur le cache local et en ne rechargeant que ce qui manque ou a
 * expiré. L'ordre d'entrée est conservé ; un café dont la fiche est
 * introuvable est simplement omis.
 */
export async function resolveCafes(ids: string[]): Promise<Cafe[]> {
  if (ids.length === 0) return [];

  const cache = await readCache();
  const now = Date.now();

  const isFresh = (entry: Entry | undefined): entry is Entry =>
    entry !== undefined && now - entry.cachedAt < TTL_MS;

  const staleIds = ids.filter((id) => !isFresh(cache[id]));

  const refreshed = await Promise.all(
    staleIds.map(async (id) => {
      try {
        return { id, snapshot: await fetchCafeSnapshot(id) };
      } catch (err) {
        // Hors ligne, quota dépassé, lieu supprimé : on garde la version
        // périmée si on en a une, plutôt que de faire disparaître le café.
        console.warn(`Fiche du café ${id} indisponible`, err);
        return null;
      }
    })
  );

  let updated = false;
  for (const result of refreshed) {
    if (!result) continue;
    cache[result.id] = { snapshot: result.snapshot, cachedAt: now };
    updated = true;
  }

  // Évite que le cache enfle indéfiniment avec des cafés retirés des favoris.
  const kept: CacheMap = {};
  for (const id of ids) {
    if (cache[id]) kept[id] = cache[id];
  }
  if (updated || Object.keys(kept).length !== Object.keys(cache).length) {
    writeCache(kept);
  }

  return ids.map((id) => kept[id]).filter(Boolean).map((entry) => materializeCafe(entry.snapshot));
}

/**
 * Alimente le cache avec une fiche déjà chargée (au moment où l'utilisateur
 * met un café en favori, par exemple) pour éviter un aller-retour réseau
 * inutile au prochain affichage de la liste.
 */
export async function primeCafeCache(snapshot: CafeSnapshot) {
  const cache = await readCache();
  cache[snapshot.id] = { snapshot, cachedAt: Date.now() };
  writeCache(cache);
}

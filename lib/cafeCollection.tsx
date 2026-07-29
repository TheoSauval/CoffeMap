import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './supabase';
import { useAuth } from './auth';
import { resolveCafes } from './cafeCache';
import type { Cafe } from '@/types/cafe';

export type CafeCollectionValue = {
  cafes: Cafe[];
  loading: boolean;
  has: (id: string) => boolean;
  toggle: (cafe: Cafe) => void;
};

/**
 * Liste de cafés rattachée à l'utilisateur (favoris, cafés visités).
 *
 * Seul l'identifiant Google du lieu est conservé, en base comme sur l'appareil :
 * les conditions de Google Maps Platform n'autorisent pas à stocker durablement
 * le contenu des fiches. Les fiches affichables sont reconstituées par
 * `resolveCafes`, qui s'appuie sur un cache local à durée limitée.
 */
export function createCafeCollection({
  table,
  guestKey,
  label,
}: {
  table: 'favorites' | 'visited';
  guestKey: string;
  label: string;
}) {
  const idCacheKey = (userId: string) => `coffeemap:${table}:ids:${userId}`;

  // Les versions précédentes stockaient les fiches complètes ; on accepte
  // encore ce format en lecture pour ne pas perdre les listes déjà présentes
  // sur l'appareil.
  async function readLocalIds(key: string): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(key);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) =>
          typeof item === 'string' ? item : (item as Cafe | null)?.id ?? null
        )
        .filter((id): id is string => Boolean(id));
    } catch {
      return [];
    }
  }

  function writeLocalIds(key: string, ids: string[]) {
    AsyncStorage.setItem(key, JSON.stringify(ids)).catch(() => {});
  }

  async function fetchRemoteIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase.from(table).select('cafe_id').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map((row) => row.cafe_id as string);
  }

  async function addRemote(userId: string, cafeId: string) {
    const { error } = await supabase
      .from(table)
      .upsert({ user_id: userId, cafe_id: cafeId }, { onConflict: 'user_id,cafe_id' });
    if (error) throw error;
  }

  async function removeRemote(userId: string, cafeId: string) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)
      .eq('cafe_id', cafeId);
    if (error) throw error;
  }

  const Context = createContext<CafeCollectionValue | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const [ids, setIds] = useState<string[]>([]);
    const [cafes, setCafes] = useState<Cafe[]>([]);
    const [loading, setLoading] = useState(true);

    // Charge les identifiants (locaux ou distants) au démarrage et à chaque
    // changement de compte.
    useEffect(() => {
      let cancelled = false;

      (async () => {
        setLoading(true);

        if (!userId) {
          const local = await readLocalIds(guestKey);
          if (!cancelled) setIds(local);
          return;
        }

        try {
          // Les cafés ajoutés en mode invité sur cet appareil rejoignent le
          // compte une seule fois — le stock invité est vidé juste après.
          const guestIds = await readLocalIds(guestKey);
          if (guestIds.length > 0) {
            await Promise.all(guestIds.map((id) => addRemote(userId, id)));
            await AsyncStorage.removeItem(guestKey);
          }

          const remote = await fetchRemoteIds(userId);
          if (cancelled) return;
          setIds(remote);
          writeLocalIds(idCacheKey(userId), remote);
        } catch (err) {
          console.warn(`${label} : synchronisation impossible, lecture du cache local`, err);
          const cached = await readLocalIds(idCacheKey(userId));
          if (!cancelled) setIds(cached);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [userId]);

    // Reconstitue les fiches dès que la liste d'identifiants change.
    useEffect(() => {
      let cancelled = false;

      (async () => {
        const resolved = await resolveCafes(ids);
        if (cancelled) return;
        setCafes((current) => {
          // Un café tout juste ajouté est déjà dans l'état avec sa fiche
          // fraîche : on la garde si le cache ne l'a pas encore.
          const byId = new Map(resolved.map((cafe) => [cafe.id, cafe]));
          return ids
            .map((id) => byId.get(id) ?? current.find((cafe) => cafe.id === id))
            .filter((cafe): cafe is Cafe => Boolean(cafe));
        });
        setLoading(false);
      })();

      return () => {
        cancelled = true;
      };
    }, [ids]);

    const has = useCallback((id: string) => ids.includes(id), [ids]);

    const toggle = useCallback(
      (cafe: Cafe) => {
        const present = ids.includes(cafe.id);
        const nextIds = present ? ids.filter((id) => id !== cafe.id) : [...ids, cafe.id];

        setIds(nextIds);
        setCafes((current) =>
          present ? current.filter((item) => item.id !== cafe.id) : [...current, cafe]
        );

        if (userId) {
          writeLocalIds(idCacheKey(userId), nextIds);
          const call = present ? removeRemote(userId, cafe.id) : addRemote(userId, cafe.id);
          call.catch((err) => console.warn(`${label} : écriture impossible`, err));
        } else {
          writeLocalIds(guestKey, nextIds);
        }
      },
      [ids, userId]
    );

    const value = useMemo<CafeCollectionValue>(
      () => ({ cafes, loading, has, toggle }),
      [cafes, loading, has, toggle]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useCollection(): CafeCollectionValue {
    const context = useContext(Context);
    if (!context) throw new Error(`${label} : provider manquant`);
    return context;
  }

  return { Provider, useCollection };
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './supabase';
import { useAuth } from './auth';
import type { Recipe } from '@/types/recipe';

const GUEST_KEY = 'coffeemap:recipes:guest';
const cacheKey = (userId: string) => `coffeemap:recipes:cache:${userId}`;

type RecipesContextValue = {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  removeRecipe: (id: string) => void;
};

const RecipesContext = createContext<RecipesContextValue | null>(null);

async function readLocal(key: string): Promise<Recipe[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(key: string, recipes: Recipe[]) {
  AsyncStorage.setItem(key, JSON.stringify(recipes)).catch(() => {});
}

type RemoteRow = {
  id: string;
  title: string;
  notes: string;
  source_url: string | null;
  created_at: string;
};

function fromRow(row: RemoteRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    sourceUrl: row.source_url,
    createdAt: new Date(row.created_at).getTime(),
  };
}

async function fetchRemoteRecipes(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, notes, source_url, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

async function insertRemoteRecipe(
  userId: string,
  recipe: Omit<Recipe, 'id' | 'createdAt'>
): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      title: recipe.title,
      notes: recipe.notes,
      source_url: recipe.sourceUrl,
    })
    .select('id, title, notes, source_url, created_at')
    .single();
  if (error) throw error;
  return fromRow(data);
}

async function deleteRemoteRecipe(userId: string, id: string) {
  const { error } = await supabase.from('recipes').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}

export function RecipesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!userId) {
        const local = await readLocal(GUEST_KEY);
        if (!cancelled) setRecipes(local);
        return;
      }

      try {
        // Fusionne les recettes ajoutées en mode invité sur cet appareil —
        // le stock invité est vidé juste après, donc sans risque de doublon.
        const guestRecipes = await readLocal(GUEST_KEY);
        if (guestRecipes.length > 0) {
          await Promise.all(
            guestRecipes.map((recipe) =>
              insertRemoteRecipe(userId, {
                title: recipe.title,
                notes: recipe.notes,
                sourceUrl: recipe.sourceUrl,
              })
            )
          );
          await AsyncStorage.removeItem(GUEST_KEY);
        }

        const remote = await fetchRemoteRecipes(userId);
        if (cancelled) return;
        setRecipes(remote);
        writeLocal(cacheKey(userId), remote);
      } catch (err) {
        console.warn('Recettes : sync Supabase impossible, utilisation du cache local', err);
        const cached = await readLocal(cacheKey(userId));
        if (!cancelled) setRecipes(cached);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const value = useMemo<RecipesContextValue>(
    () => ({
      recipes,

      addRecipe: (recipe) => {
        if (!userId) {
          setRecipes((current) => {
            const next = [{ ...recipe, id: `${Date.now()}`, createdAt: Date.now() }, ...current];
            writeLocal(GUEST_KEY, next);
            return next;
          });
          return;
        }

        // Entrée optimiste immédiate, remplacée par la ligne réelle
        // (id Supabase) une fois l'insertion confirmée.
        const tempId = `temp-${Date.now()}`;
        setRecipes((current) => [{ ...recipe, id: tempId, createdAt: Date.now() }, ...current]);

        insertRemoteRecipe(userId, recipe)
          .then((saved) => {
            setRecipes((current) => {
              const next = current.map((r) => (r.id === tempId ? saved : r));
              writeLocal(cacheKey(userId), next);
              return next;
            });
          })
          .catch((err) => {
            console.warn('Recettes : écriture Supabase impossible', err);
            setRecipes((current) => current.filter((r) => r.id !== tempId));
          });
      },

      removeRecipe: (id) => {
        setRecipes((current) => {
          const next = current.filter((recipe) => recipe.id !== id);
          writeLocal(userId ? cacheKey(userId) : GUEST_KEY, next);
          return next;
        });

        if (userId) {
          deleteRemoteRecipe(userId, id).catch((err) =>
            console.warn('Recettes : suppression Supabase impossible', err)
          );
        }
      },
    }),
    [recipes, userId]
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes() {
  const context = useContext(RecipesContext);
  if (!context) throw new Error('useRecipes must be used within a RecipesProvider');
  return context;
}

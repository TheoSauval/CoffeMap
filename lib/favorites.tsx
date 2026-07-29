import { createCafeCollection } from './cafeCollection';

const collection = createCafeCollection({
  table: 'favorites',
  guestKey: 'coffeemap:favorites:guest',
  label: 'Favoris',
});

export const FavoritesProvider = collection.Provider;

export function useFavorites() {
  const { cafes, loading, has, toggle } = collection.useCollection();
  return {
    favorites: cafes,
    loading,
    isFavorite: has,
    toggleFavorite: toggle,
  };
}

import { createCafeCollection } from './cafeCollection';

const collection = createCafeCollection({
  table: 'visited',
  guestKey: 'coffeemap:visited:guest',
  label: 'Cafés visités',
});

export const VisitedProvider = collection.Provider;

export function useVisited() {
  const { cafes, loading, has, toggle } = collection.useCollection();
  return {
    visited: cafes,
    loading,
    isVisited: has,
    toggleVisited: toggle,
  };
}

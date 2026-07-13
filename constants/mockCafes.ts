export type Cafe = {
  id: string;
  name: string;
  tagline: string;
  address: string;
  rating: number;
  tags: string[];
  latitude: number;
  longitude: number;
};

// Données factices centrées sur Paris — à remplacer par une vraie source
// (API interne, Google Places, etc.) une fois le backend branché.
export const mockCafes: Cafe[] = [
  {
    id: '1',
    name: 'Vaca Café',
    tagline: 'El cafecito que estabas necesitando',
    address: '12 Rue de Charonne, Paris',
    rating: 4.8,
    tags: ['Vegan', 'Pour-over', 'Cosy'],
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    id: '2',
    name: 'Le Comptoir Torréfié',
    tagline: 'Torréfaction artisanale depuis 2019',
    address: '45 Rue Oberkampf, Paris',
    rating: 4.6,
    tags: ['Torréfacteur', 'Wifi', 'Terrasse'],
    latitude: 48.8639,
    longitude: 2.3789,
  },
  {
    id: '3',
    name: 'Grain Noir',
    tagline: 'Espresso bar minimaliste',
    address: '8 Rue des Martyrs, Paris',
    rating: 4.5,
    tags: ['Espresso', 'À emporter'],
    latitude: 48.8809,
    longitude: 2.3383,
  },
  {
    id: '4',
    name: 'Brûlerie Saint-Paul',
    tagline: 'Le rendez-vous des amateurs',
    address: '19 Rue Saint-Paul, Paris',
    rating: 4.7,
    tags: ['Brunch', 'Cosy', 'Wifi'],
    latitude: 48.8534,
    longitude: 2.3634,
  },
];

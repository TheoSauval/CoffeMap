import type { Cafe } from './cafe';

export type CafeDetails = Cafe & {
  userRatingCount: number | null;
  phone: string | null;
  website: string | null;
  openingHours: string[] | null;
  priceLevel: string | null;
};

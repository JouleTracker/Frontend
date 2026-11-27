export type HomeType = 'House' | 'Apartment' | 'Office/Premises';

export interface HomeConfiguration {
  userId: number;
  homeType: HomeType;
  occupants: number;
  location: string;
  tariff: string;
  configured: boolean;
}

export interface UpdateHomeConfiguration {
  homeType: HomeType;
  occupants: number;
  location: string;
  tariff: string;
}

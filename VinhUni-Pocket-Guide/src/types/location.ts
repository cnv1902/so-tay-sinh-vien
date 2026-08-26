export type LocationCategory =
  | "building"
  | "classroom"
  | "administration"
  | "food"
  | "transport"
  | "healthcare"
  | "security"
  | "other";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Location = {
  id: string;

  name: string;

  description?: string;

  purpose?: string;

  category: LocationCategory;

  address?: string;

  floor?: string;

  room?: string;

  coordinate: Coordinate;

  phone?: string;

  isInsideCampus: boolean;
};

export type LayerType = {
  id: string;
  layer: any;
  description: string;
  images: string[];
};

export type LatLng = {
  lat: number;
  lng: number;
};

export type Options = {
  stroke: boolean;
  color: string;
  weight: number;
  opacity: number;
  fill: boolean;
  fillColor: string | null;
  fillOpacity: number;
  clickable: boolean;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export enum RoleEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

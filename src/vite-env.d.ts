/// <reference types="vite/client" />

declare module 'mapbox-gl' {
  const mapboxgl: any;
  export default mapboxgl;
  export type Map = any;
  export type Marker = any;
  export type Popup = any;
  export type GeoJSONSource = any;
  export type LngLatBounds = any;
}

declare module 'virtual:pwa-register';

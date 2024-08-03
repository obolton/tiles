declare namespace JSX {
  interface IntrinsicElements {
    "map-view": {
      id?: string;
      class?: string;
      movable?: boolean;
      lat: number;
      long: number;
      bounds?: string;
      label?: string;
    };
  }
}

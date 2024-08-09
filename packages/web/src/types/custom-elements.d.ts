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
    "embedded-video": {
      id?: string;
      class?: string;
      src: string;
      imagesrc?: string;
    };
    "profile-image": {
      id?: string;
      class?: string;
      src?: string | null;
      name?: string | null;
    };
  }
}
